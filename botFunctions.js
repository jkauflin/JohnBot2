/*==============================================================================
(C) Copyright 2017,2018,2019,2020 John J Kauflin, All rights reserved. 
-----------------------------------------------------------------------------
DESCRIPTION: NodeJS module to handle robot functions.  Communicates with
             the Arduino Mega, and accepts commands from connected web
             application
-----------------------------------------------------------------------------
Modification History
2017-12-31 JJK  Loaded ConfigurableFirmata on the Arduino Mega.
                LED functions working ok
2018-01-12 JJK  Tested LED, Servo, and Motor successfully.  Connecting 
                servo back on motorshield and using 4 AA pack shared with
                motors
2018-01-15 JJK  Creating functions to be called from the controller
2018-01-24 JJK  Corrections after testing manual controls
2018-01-26 JJK  Modified board initialization for running as a service
2018-01-27 JJK  Modified to use PingFirmata to get the HC-SR04 ultrasonic
                proximity sensor working
2018-02-10 JJK  Implemented the general botEvent, checking for Board errors,
                and sending an error event.
                Working with proximity sensors
2018-12-01 JJK  Updated to johnny-five 1.0.0
2018-12-21 JJK  Getting the robot function working again
2018-12-22 JJK  Adding animation to go along with speaking text
2018-12-26 JJK  Got some speech animation working using LED strobe, and
                servo animations for head and arm (turned off with and event
                from the client saying the utterance was done speaking)
2019-01-30 JJK  Modified the animate speech to calculate time from words
                (like the JohnBot in Android did)
2019-02-10 JJK  Added boardReady check before executing commands
2019-02-15 JJK  Added logic for walkAbout - realized I needed a way to 
                execute multiple async loop commands in order, so implemented
                an execution controller and a command request array
2019-02-16 JJK  Added stop and turn around on close proximity
2019-03-29 JJK  Moved the motor initialize to the top
2019-04-07 JJK  Updated the rotate duration calculation
2019-04-10 JJK  Adjustments to the rotate calculations (to get better)
                Working on proximity slow and stop
2019-04-12 JJK  Checking servo sweep and position functions (for improved
                object awareness with the proximity sensor)
                Adjusting proximity actions - got walk around working better
2019-06-23 JJK  Getting servo sweep with proximity sensor working (now that
                Amy has glued it together), and modified the walk around
                to turn the right direction away from the proximity alert
2019-07-06 JJK  Cleaning up command execution and state to give more 
                encapsulation and independance (so they can be more complex)
2019-07-07 JJK  Did not work well trying to put everything through the 
                command queue, so I'm trying some more direct calls like
                I was doing
2019-07-21 JJK  Working better with direct calls.  Added a backup for close
                proximities.  Working on checking the health of the proximity
                sensor
2019-09-22 JJK  Checking functions (updated to johnny-five 1.3.1)
2019-10-03 JJK  Getting 2nd distance sensor working, and adding a piezo 
                speaker
2020-05-04 JJK  Trying to get the JohnBot working on a full Pi rather than
                a Pi Zero (to see if the sensors work better)
2020-05-09 JJK  Re-checking distance sensors, cntrl-c, and all stop functions
                Fixed bug in proximityAlert for 2 sensors
                Added execution with forever and a reset option (for when
                it freezes up).  Working on the speaking animation
2020-05-12 JJK  Implementing _proximitySensor handler
                Working on moving, walking, and rotate
2020-05-17 JJK  Turning off the head and arm servos for now (power problems)
                Working on moving logical
=============================================================================*/
var dateTime = require('node-datetime');

const EventEmitter = require('events');
// EventEmitter object (to send events outside of this module)
var botEvent = new EventEmitter();

// When running Johnny-Five programs as a sub-process (eg. init.d, or npm scripts), 
// be sure to shut the REPL off!
var five = require("johnny-five");
var board = new five.Board({
    repl: true,
    debug: true
});
//var dt = dateTime.create();
//var formatted = dt.format('Y-m-d H:M:S');

// Constants for pin numbers and commands
const LEFT_EYE = 45;
const RIGHT_EYE = 44;
const ARM_SERVO = 9;
const HEAD_SERVO = 10;
const PROXIMITY_SERVO = 11;
const PROXIMITY1_PIN = 7;
const PROXIMITY2_PIN = 6;
const PROXIMITY_MAX = 20;
const PROXIMITY_CLOSE_MAX = 11;
const FORWARD = 'F';
const BACKWARD = 'R';
const RIGHT = 'R';
const LEFT = 'L';
const DEFAULT_MOTOR_SPEED = 150;
//const TURN_AROUND = [RIGHT, 0, 180, 200];

// Variables for controlling robot components
var eyes;
var leftEyeLed;
var rightEyeLed;
var motorConfig = five.Motor.SHIELD_CONFIGS.ADAFRUIT_V2;
var motor1;
var motor2;
var motorSpeed = DEFAULT_MOTOR_SPEED;
var headServo;
var armServo;
var headAndArm;
var proximityServo;
var proximitySensor1;
var proximitySensor2;
var proximityAlert1 = false;
var proximityAlert2 = false;
var currProx1 = 0;
var currProx2 = 0;
var prevProx1 = 0;
var prevProx2 = 0;
var speechAnimation;
var piezo;

// State variables
var boardReady = false;
var currState = "stopped";  // moving
var currMode = "";  // walk, walkAbout

var speaking = false;
var moving = false;
var eyesOn = false;
var moveDirection = FORWARD;
var rotateDirection = RIGHT;

// Mode variables
var walkMode = false;
var walkAboutMode = false;


board.on("error", function (err) {
    log("*** Error in Board, err = "+err);
    boardReady = false;
    botEvent.emit("error", "*** Error in Board, err = "+err);
    // Exit the process (so that Forever will re-start and reset the board)
    process.exit(1);
}); // board.on("error", function() {

// When the board is ready, create and intialize global component objects (to be used by functions)
board.on("ready", function () {
    log("*** Johnny-Five to PingFirmata on arduino mega board READY ***");
    boardReady = true;

    // If the board is exiting, turn everything off
    this.on("exit", function () {
        log("EXIT - All Stop");
        _allStop();
        process.exit(1);
    });
    // Handle a termination signal
    process.on('SIGTERM', function () {
        log('on SIGTERM');
        _allStop();
        process.exit(1);
    });

    // Initialize components connected to the arduino board
    createComponents();

}); // board.on("ready", function() {


function createComponents() {
    // Initialize the legs (do this first)
    motor1 = new five.Motor(motorConfig.M1);
    motor2 = new five.Motor(motorConfig.M2);

    // Initialize the proximity sensor
    proximitySensor1 = new five.Proximity({
        controller: "HCSR04",
        pin: PROXIMITY1_PIN
    });

    proximitySensor2 = new five.Proximity({
        controller: "HCSR04",
        pin: PROXIMITY2_PIN
    });

    piezo = new five.Piezo(3);
    //_playSong();

    // Create an Led on pin 13
    leftEyeLed = new five.Led(LEFT_EYE);
    rightEyeLed = new five.Led(RIGHT_EYE);
    eyes = new five.Leds([leftEyeLed, rightEyeLed]);

    // Initialize the Head and Arm servos
    /*
    headServo = new five.Servo({
        id: "HeadServo",            // User defined id
        pin: HEAD_SERVO,            // Which pin is it attached to?
        //type: "standard",         // Default: "standard". Use "continuous" for continuous rotation servos
        //range: [10, 160],         // Default: 0-180
        fps: 100,                   // Used to calculate rate of movement between positions
        //invert: false,            // Invert all specified positions
        //startAt: headStartPos,    // Immediately move to a degree
        center: true                // overrides startAt if true and moves the servo to the center of the range
    });

    armServo = new five.Servo({
        id: "ArmServo",             // User defined id
        pin: ARM_SERVO,             // Which pin is it attached to?
        //type: "standard",         // Default: "standard". Use "continuous" for continuous rotation servos
        //range: [10, 150],         // Default: 0-180
        fps: 100,                   // Used to calculate rate of movement between positions
        //invert: false,            // Invert all specified positions
        //startAt: armStartPos,     // Immediately move to a degree
        center: true                // overrides startAt if true and moves the servo to the center of the range
    });

    // Create a animation for the head and arm
    headAndArm = new five.Servos([headServo, armServo]);
    speechAnimation = new five.Animation(headAndArm);

    proximityServo = new five.Servo({
        id: "ProximityServo",       // User defined id
        pin: PROXIMITY_SERVO,       // Which pin is it attached to?
        //type: "standard",         // Default: "standard". Use "continuous" for continuous rotation servos
        //range: [10, 170],         // Default: 0-180
        fps: 100,                   // Used to calculate rate of movement between positions
        //invert: false,            // Invert all specified positions
        //startAt: 90,              // Immediately move to a degree
        center: true                // overrides startAt if true and moves the servo to the center of the range
    });
    */

    // Set up a handler for the proximity sensor data
    _proximitySensors();
}

function _proximitySensors() {
    var proximityOffsetDegrees = 0;

    // Check for changes in the proximity sensor
    proximitySensor1.on("data", function () {

        // Ignore sensor values over a Max (to reduce the number of times you check it)
        if (this.in > 1 && this.in < PROXIMITY_MAX) {
            // Round to integer inch values
            currProx1 = Math.round(this.in);

            if (currProx1 != prevProx1) {
                //log("Proximity currProx1 = " + currProx1);
                // If the Proximity inches changes, send an event with current value
                //botEvent.emit("proxIn", currProx1);

                // If close to something, set the proximity alert State and save the position
                if (currProx1 < PROXIMITY_CLOSE_MAX) {
                    proximityAlert1 = true;
                    //proximityOffsetDegrees = 90 - Math.round(proximityServo.position);
                    proximityOffsetDegrees = 90;
                    //log("ProximityAlert1: " + currProx1 + ", Proximity POS: " + Math.round(proximityServo.position) + ", offset = " + proximityOffsetDegrees);
                    //piezo.frequency(700, 5000);
                    _handleCloseProximityAlert(currProx1, proximityOffsetDegrees);
                } else {
                    proximityAlert1 = false;
                    //log("------------ ProximityAlert1 OFF, currProx1 = " + currProx1)
                    if (!proximityAlert1 && !proximityAlert2) {
                        //piezo.off();
                    }
                }

                prevProx1 = currProx1;
            }
        } //
    }); // 

    // Check for changes in the proximity sensor
    proximitySensor2.on("data", function () {
        // Round to integer inch values

        // Ignore sensor values over a Max (to reduce the number of times you check it)
        if (this.in > 1 && this.in < PROXIMITY_MAX) {
            currProx2 = Math.round(this.in);

            if (currProx2 != prevProx2) {
                //log("Proximity currProx2 = " + currProx2);
                // If the Proximity inches changes, send an event with current value
                //botEvent.emit("proxIn", currProx2);
                // If close to something, set the proximity alert State and save the position
                if (currProx2 < PROXIMITY_CLOSE_MAX) {
                    proximityAlert2 = true;
                    //log("ProximityAlert2: " + currProx2);
                    //piezo.frequency(300, 5000);
                    _handleCloseProximityAlert(currProx2,90);
                } else {
                    proximityAlert2 = false;
                    //log("------------ ProximityAlert2 OFF, currProx2 = " + currProx2)
                    if (!proximityAlert2 && !proximityAlert2) {
                        //piezo.off();
                    }
                }

                prevProx2 = currProx2;
            }
        } // if (currProx2 < PROXIMITY_MAX) {
    });

} // function _proximitySensors() {

function _handleCloseProximityAlert(inProx, proximityOffsetDegrees) {
    if ((proximityAlert1 || proximityAlert2) && moving == true) {
        log(">>> Close Proximity (MOVING): " + inProx);

        _stopWalking();  // without checking restart

        var tempDuration = 1000;
        /* 2019-10-06 Try turning off back for now ****************************************************
        if (currProx < 5) {
            _backup();
            tempDuration += 1000;
        }
        */

        // somehow check if it is in a corner???
        // 7/14/2019 - close into to something, or have another proximity quickly
        //      turn more - like all the way around?  stop first and pause more?  go slower?  
        //      backup a bit?

        // ************** ALSO, find a way to check the health of the prox sensor, and re-start if needed *************

        // Rotate away from the proximity alert direction (using proximity offset to calculate the best direction)
        /*
        var rotateDir = RIGHT;
        if (proximityOffsetDegrees < 0) {
            rotateDir = LEFT;
        }
        var rotateDegrees = 45 + Math.round(proximityOffsetDegrees);
        setTimeout(_rotate, tempDuration, 0, rotateDegrees, 170);
        */
    }
}

function _playSong() {
    // Plays a song
    piezo.play({
        // song is composed by an array of pairs of notes and beats
        // The first argument is the note (null means "no note")
        // The second argument is the length of time (beat) of the note (or non-note)
        song: [
            ["C4", 1 / 4],
            ["D4", 1 / 4],
            ["F4", 1 / 4],
            ["D4", 1 / 4],
            ["A4", 1 / 4],
            [null, 1 / 4],
            ["A4", 1],
            ["G4", 1],
            [null, 1 / 2],
            ["C4", 1 / 4],
            ["D4", 1 / 4],
            ["F4", 1 / 4],
            ["D4", 1 / 4],
            ["G4", 1 / 4],
            [null, 1 / 4],
            ["G4", 1],
            ["F4", 1],
            [null, 1 / 2]
        ],
        tempo: 100
    });
}


function _doneSpeaking() {
    //log("doneSpeaking");
    if (speaking) {
        //log("clearTimeout for _doneSpeaking");
        clearTimeout(_doneSpeaking);
        //speechAnimation.stop();
        eyes.stop().off();
        speaking = false;
    }
}

function _animateSpeech(textToSpeak) {
    // Cancel any running animations before starting a new one
    _doneSpeaking();

    // Calculate a milliseconds time from the textToSpeak and set a _doneSpeaking function call
    // (just calculate using the word count for now)
    var wordList = textToSpeak.split(" ");
    //for (var i = 0; i < wordList.length; i++) {
    //wordList[i]
    //}
    var speakingDuration = wordList.length * 309;
    setTimeout(_doneSpeaking, speakingDuration);
    speaking = true;
    // Start strobing the eye leds
    eyes.strobe(150);

    try {
        /*
        speechAnimation.enqueue({
            duration: 2000,
            cuePoints: [0, 0.25, 0.5, 0.75, 1.0],
            keyFrames:
                [
                    [null, { degrees: 50 }, { degrees: 120 }, { degrees: 55 }, { degrees: 90 }],
                    [null, { degrees: 60 }, { degrees: 105 }, { degrees: 75 }, { degrees: 90 }]
                ],
            loop: true,
            onstop: function () {
                //console.log("Animation stopped");
                //Use onstop functions when your looping animation is halted to return a bot's animated limbs to their home positions.
                //Nearly always use null as the first value in an animation segment. It allows the segment to be started from a variety of positions.
              
                // Center?  seems to mess things up
                //headAndArm.home();
            },
            oncomplete: function () {
                //console.log("Animation complete");
            }
        });
        */
    }
    catch (error) {
        console.error(">>> speechAnimation error = " + error);
    }
}


// >>>>>>>>>>>>> commands need to be loosely-coupled, encapsulated, independant - just setting State
function _startWalking(inSpeed) {
    if (proximityAlert1 || proximityAlert2) {
        log("*** ProximityAlert - CANNOT start walking");
    } else {
        // ok 
        log("_startWalking");
    }

    var tempSpeed = DEFAULT_MOTOR_SPEED;
    if (inSpeed != null) {
        tempSpeed = inSpeed;
    }
    motor2.forward(tempSpeed);
    motor1.forward(tempSpeed);
    //currState = "moving";
    moving = true;
    /*
    proximityServo.sweep({
        range: [40, 140],
        interval: 1600,
        step: 10
    });
    */
}

function _backup(inDuration) {
    log("_backup");
    var tempDuration = 500;
    if (inDuration != null) {
        tempDuration = inDuration;
    }
    motor2.reverse(DEFAULT_MOTOR_SPEED);
    motor1.reverse(DEFAULT_MOTOR_SPEED);
    setTimeout(_stopWalking, tempDuration);
}

function _stopWalking(checkRestart) {
    log("_stopWalking, checkRestart = " + checkRestart);
    motor1.stop();
    motor2.stop();
    //proximityServo.stop();
    //currState = "stopped";
    moving = false;

    if (checkRestart) {
        log("Check restart");
        if (currMode.substr(0, 4) == "walk") {
            _walk();
            //commands.push("_walk");
            //commandParams.push([1000, null, null, motorSpeed]);
        }
    }
    // if next command is walk - restart walking

    //clearTimeout(_rotate);
    //_executeCommands();
}

function _walk(direction, duration, speed) {
    var tempSpeed = motorSpeed;  // Default to current motor speed
    if (speed != null) {
        tempSpeed = speed;
    }
    log("in _walk, speed = " + tempSpeed);

    _startWalking(tempSpeed);
}

function _walkAbout() {
    // *** at some point add logic to specify the size of a circle to stay in
    // how far in one direction - speed * duration

    // *** maybe stop after a maximum time?
    log("starting _walkAbout");

    var randomDuration = _getRandomInt(7, 14) * 1000;
    var randomSpeed = _getRandomInt(150, 210);
    var randomRotate = _getRandomInt(55, 200);
    var randomDirection = RIGHT;
    if (_getRandomInt(0, 1)) {
        randomDirection = RIGHT;
    } else {
        randomDirection = LEFT;
    }

    log("_walkAbout, randomSpeed = " + randomSpeed);
    //_startWalking(randomSpeed);

    // After a random duration at this speed in this direction, rotate and start again
    /*
    commands.push("_rotate");
    commandParams.push([randomDirection, 0, randomRotate, randomSpeed]);
    commands.push("_walkAbout");
    commandParams.push([]);

    setTimeout(_executeCommands, randomDuration);
    */

} // function _walkAbout() {


function _rotate(direction, duration, degrees, speed) {
    // If direction is blank, stop
    /*
    if (direction == undefined || direction == null) {
        var commandDurationMs = Date.now() - commandStartMs;
        log("%%%%%%% STOPPING rotate, duration = " + commandDurationMs);
        //_allStop();
        motor1.stop();
        motor2.stop();
        _executeCommands();
    } else {
    */
    log("!!! Starting rotate, degrees = " + degrees + ", speed = " + speed + ", duration = " + duration);
    //commandStartMs = Date.now();
    var tempSpeed = motorSpeed;
    if (speed != null) {
        if (speed > 0) {
            tempSpeed = speed;
        }
    }

    var tempDegrees = 0;
    var tempDuration = 0;

    // If degrees are set, calculate duration from speed
    if (degrees != null) {
        tempDegrees = degrees;
        if (degrees > 360) {
            tempDegrees = 360;
        } else if (degrees < 0) {
            tempDegrees = 0;
        }

        // Calculate duration given speed and degrees
        //tempDuration = (242521.3 * Math.pow(tempSpeed, -2.113871)) * tempDegrees;
        tempDuration = Math.round((777.5644 + (12661510000 - 777.5644) /
            (1 + Math.pow((tempSpeed / 0.6116105), 3.096302))) * (tempDegrees / 180));
        /*
        var speedPercent = tempSpeed / 255.0;
        var extraDuration = -90;
        if (speedPercent < 0.3) {
            extraDuration = Math.round(-(380.0 * (1-speedPercent)));
        } else if (speedPercent < .5) {
            extraDuration = Math.round(380.0 * speedPercent);
        } else {
            extraDuration = Math.round(-(180.0 * speedPercent));
        }
        if (speedPercent > 0.35 && speedPercent < 0.8) {
            extraDuration = 270;
        }

        tempDuration += extraDuration;
        */
    }

    // If duration or degress are set, then set a timeout of when to stop
    if (duration != null && tempDuration == 0) {
        tempDuration = duration;
    }

    // Set a timeout to stop rotating after a period of time (and check to restart a mode)
    if (tempDuration > 0) {
        log("***** SetTimeout rotate, degrees = " + tempDegrees + ", speed = " + tempSpeed + ", tempDuration = " + tempDuration);
        var checkRestart = true;
        setTimeout(_stopWalking, tempDuration, checkRestart);
        //commands.push("_stopWalking");
        //commandParams.push([tempDuration]);
    }

    if (direction == LEFT) {
        motor1.forward(tempSpeed);
        motor2.reverse(tempSpeed);
    } else {
        motor2.forward(tempSpeed);
        motor1.reverse(tempSpeed);
    }

} // function _rotate() {


// Handle commands from the web client
function command(botMessage) {
    log("in command, botMessage = " + JSON.stringify(botMessage));

    if (botMessage.restart != null) {
        process.exit(1);
    }

    if (!boardReady) {
        return;
    }

    if (botMessage.stop != null) {
        _allStop();
    }

    if (botMessage.eyes != null) {
        if (botMessage.eyes) {
            eyes.on();
            eyesOn = true;
        } else {
            eyes.off();
            eyesOn = false;
        }
    }

    if (botMessage.armPosition != null) {
        armServo.to(botMessage.armPosition);
        //currArmPos = botMessage.armPosition;
        //log(">>> armServo, currArmPos = "+ currArmPos +", pos = " + armServo.position);
    }
    if (botMessage.headPosition != null) {
        headServo.to(botMessage.headPosition);
    }

    if (botMessage.textToSpeak != null) {
        // Animate the text being spoken by the browser client
        _animateSpeech(botMessage.textToSpeak);
    }

    // Manual moving (walking)
    if (botMessage.motorSpeed != null) {
        motorSpeed = botMessage.motorSpeed;
    }
    if (botMessage.move != null) {
        if (botMessage.moveDirection != null) {
            moveDirection = botMessage.moveDirection;
        }
        if (botMessage.move) {
            if (moveDirection == BACKWARD) {
                motor1.reverse(motorSpeed);
                motor2.reverse(motorSpeed);
            } else {
                motor1.forward(motorSpeed);
                motor2.forward(motorSpeed);
            }
        } else {
            motor1.stop();
            motor2.stop();
        }
    }

    //+ (walk(around | about | faster | slower | left | right | forward | backward))
    if (botMessage.walk != null) {
        /*
        _allStop();
        if (botMessage.walkCommand == "around" || botMessage.walkCommand == "about") {
            currMode = "walkAbout";
            //walkAboutMode = true;
        } else if (botMessage.walkCommand == "forward") {
            currMode = "walkForward";
            //walkMode = true;
        }
        _walk();
        */
    }

    if (botMessage.rotate != null) {
        if (botMessage.rotate) {
            var direction = RIGHT;
            if (botMessage.rotateDirection != null) {
                direction = botMessage.rotateDirection;
            }

            //_rotate(direction, botMessage.rotateDuration, botMessage.rotateDegrees, botMessage.rotateSpeed);
            
            //commands.push("_rotate");
            //commandParams.push([0, direction, botMessage.rotateDuration, botMessage.rotateDegrees, botMessage.rotateSpeed]);
            //_executeCommands();

        } else {
            // Call with null parameters to STOP
            //_rotate();
            //_stopWalking() - queue command????????????????????????????
            // push command to stop
        }
    }

} // function control(botMessage) {

function _allStop() {
    log("ALL STOP");
    // Stop all components
    _doneSpeaking();
    // Stop all motion
    _stopWalking();



    //walkAboutMode = false;
    //walkMode = false;
    // Clear the function calls
    /*
    clearTimeout(_executeCommands);
    clearTimeout(_stopWalking);
    clearTimeout(_startWalking);
    clearTimeout(_rotate);
    clearTimeout(_walk);
    clearTimeout(_walkAbout);
    */
}

function log(outStr) {
    console.log(dateTime.create().format('H:M:S.N') + " " + outStr);
}


function _getRandomInt(min, max) {
    // Floor - rounded down to the nearest integer
    return Math.floor(Math.random() * (max - min)) + min;
}

module.exports = {
    botEvent,
    command
};
