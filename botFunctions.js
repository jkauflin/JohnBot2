/*==============================================================================
(C) Copyright 2017 John J Kauflin, All rights reserved. 
-----------------------------------------------------------------------------
DESCRIPTION: NodeJS module to handle robot functions.  Communicates with
             the Arduino Mega
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
=============================================================================*/
var dateTime = require('node-datetime');
const EventEmitter = require('events');
// When running Johnny-Five programs as a sub-process (eg. init.d, or npm scripts), 
// be sure to shut the REPL off!
var five = require("johnny-five");
var board = new five.Board({
    repl: false,
    debug: false,
});
//var dt = dateTime.create();
//var formatted = dt.format('Y-m-d H:M:S');

// Constants for pin numbers
const LEFT_EYE = 45;
const RIGHT_EYE = 44;
const ARM_SERVO = 9;
const HEAD_SERVO = 10;
const PROXIMITY_PIN = 7;
const headStartPos = 90;
const armStartPos = 145;

// create EventEmitter object
var botEvent = new EventEmitter();

// Event Namespace
//var RoboEvents = {};
var eyes;
var leftEyeLed;
var rightEyeLed;
var motorConfig = five.Motor.SHIELD_CONFIGS.ADAFRUIT_V2;
var motor1;
var motor2;
//var motorSpeed = 100;
var motorSpeed = 100;
var headServo;
var armServo;
var headAndArm;
var proximity;
var currProx = 0;
var prevProx = 0;
var speechAnimation;
var speaking = false;
var currArmPos = 90;

const FORWARD = 'F';
const BACKWARD = 'R';
const RIGHT = 'R';
const LEFT = 'L';

var moveDirection = FORWARD;
var moving = false;
var rotateDirection = RIGHT;
var rotating = false;
var eyesOn = false;
var boardReady = false;
var walkAbout = false;
var commands = [];
var commandParams = [];

board.on("error", function () {
    //console.log("*** Error in Board ***");
    boardReady = false;
    botEvent.emit("error", "*** Error in Board ***");
}); // board.on("error", function() {

// When the board is ready, create and intialize global component objects (to be used by functions)
board.on("ready", function () {
    console.log("*** board ready ***");
    boardReady = true;

    // Initialize the legs (do this first)
    motor1 = new five.Motor(motorConfig.M1);
    motor2 = new five.Motor(motorConfig.M2);
    // Start the motor at maximum speed
    //motor2.forward(200);
    //motor1.forward(200);
    //.reverse
    //.stop
    // parameter speed - 255 max

    // Initialize the proximity sensor
    proximity = new five.Proximity({
        controller: "HCSR04",
        pin: PROXIMITY_PIN
    });

    // Create an Led on pin 13
    leftEyeLed = new five.Led(LEFT_EYE);
    rightEyeLed = new five.Led(RIGHT_EYE);
    eyes = new five.Leds([leftEyeLed, rightEyeLed]);

    // Initialize the Head and Arm servos
    headServo = new five.Servo({
        id: "HeadServo",        // User defined id
        pin: HEAD_SERVO,        // Which pin is it attached to?
        type: "standard",       // Default: "standard". Use "continuous" for continuous rotation servos
        range: [10, 170],        // Default: 0-180
        fps: 100,               // Used to calculate rate of movement between positions
        invert: false,          // Invert all specified positions
        startAt: headStartPos,  // Immediately move to a degree
        //center: true,         // overrides startAt if true and moves the servo to the center of the range
    });

    armServo = new five.Servo({
        id: "ArmServo",         // User defined id
        pin: ARM_SERVO,         // Which pin is it attached to?
        type: "standard",       // Default: "standard". Use "continuous" for continuous rotation servos
        range: [10, 170],        // Default: 0-180
        fps: 100,               // Used to calculate rate of movement between positions
        invert: false,          // Invert all specified positions
        startAt: armStartPos,   // Immediately move to a degree
        //center: true,         // overrides startAt if true and moves the servo to the center of the range
    });

    // Create a animation for the head and arm
    headAndArm = new five.Servos([headServo, armServo]);
    speechAnimation = new five.Animation(headAndArm);

    // Check for changes in the proximity sensor
    proximity.on("data", function () {
        if (this.in < 12.0) {
            // Send event message for change in proximity inches
            currProx = Math.round(this.in);
            if (currProx != prevProx) {
                botEvent.emit("proxIn", currProx);
                //console.log("Proximity: " + currProx);

                // If getting close to something, slow, stop, and turn around
                if (prevProx >= 6 && currProx < 6) {

                    // only if moving???

                    console.log("*** Proximity - slow, rotate, and walkAbout (if on) - currProx = "+currProx);
                    commands.length = 0;
                    commandParams.length = 0;
                    commands.push("_slowAndStop");
                    commandParams.push([]);
                    commands.push("_rotate");
                    commandParams.push([RIGHT, 0, 180, 160]);

                    // If walkAbout, add that to the command list to start again after turning around
                    if (walkAbout) {
                        commands.push("_walkAbout");
                        commandParams.push([]);
                    }

                    _executeCommands();
                }

                prevProx = currProx;
            } // if (currProx != prevProx) {
        } // if (this.in < 12.0) {
    }); // proximity.on("data", function () {
    /*
    proximity.on("change", function() {
      console.log("The obstruction has moved.");
    });
    */

}); // board.on("ready", function() {

// Handle commands from the web client
function command(botMessage) {
    //console.log(dateTime.create().format('H:M:S.N') + ", botMessage = " + JSON.stringify(botMessage));
    
    if (!boardReady) {
        return;
    }

    if (botMessage.stop != null) {
        _allStop();
    }

    if (botMessage.armPosition != null) {
        armServo.to(botMessage.armPosition);
        currArmPos = botMessage.armPosition;
    }
    if (botMessage.headPosition != null) {
        headServo.to(botMessage.headPosition);
    }

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
            moving = true;
        } else {
            motor1.stop();
            motor2.stop();
            moving = false;
        }
    }

    if (botMessage.walkAbout != null) {
        _allStop();
        commands.length = 0;
        commandParams.length = 0;
        commands.push("_walkAbout");
        commandParams.push([]);
        _executeCommands();
    }

    if (botMessage.rotate != null) {
        if (botMessage.rotate) {
            var direction = RIGHT;
            if (botMessage.rotateDirection != null) {
                direction = botMessage.rotateDirection;
            }

            //_rotate(direction, botMessage.rotateDuration, botMessage.rotateDegrees, botMessage.rotateSpeed);
            commands.push("_rotate");
            commandParams.push([direction, botMessage.rotateDuration, botMessage.rotateDegrees, botMessage.rotateSpeed]);
            _executeCommands();

        } else {
            // Call with null parameters to STOP
            _rotate();
        }
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

    if (botMessage.textToSpeak != null) {
        // Animate the text being spoken by the browser client
        _animateSpeech(botMessage.textToSpeak);
    }

} // function control(botMessage) {

function _slowAndStop() {
    console.log("$$$$$ in slow and Stop, motorSpeed = " + motorSpeed + ", moving = " + moving);
    if (rotating) {
        motor1.stop();
        motor2.stop();
        rotating = false;
        clearTimeout(_rotate);
    }
    if (moving) {
        if (motorSpeed < 70) {
            // When slow enough, just stop
            motor1.stop();
            motor2.stop();
            moving = false;
        } else {
            // Reduce speed by a % and wait a small period of milliseconds before checking again
            motorSpeed = motorSpeed - Math.round(motorSpeed * 0.1);
            motor1.forward(motorSpeed);
            motor2.forward(motorSpeed);
            setTimeout(_slowAndStop, 100);
        }
    }

    // Once it's stopped we're done, so send back to execute more commands
    if (!moving) {
        _executeCommands();
    }
}

function _walkAbout() {
    // *** at some point add logic to specify the size of a circle to stay in
    // how far in one direction - speed * duration

    // *** maybe stop after a maximum time?
    walkAbout = true;
    console.log("starting _walkAbout");

    var randomDuration = _getRandomInt(7, 11) * 1000;
    var randomSpeed = _getRandomInt(80, 180);
    var randomRotate = _getRandomInt(25, 100);
    var randomDirection = RIGHT;
    if (_getRandomInt(0, 1)) {
        randomDirection = RIGHT;
    } else {
        randomDirection = LEFT;
    }

    console.log("_walkAbout, randomSpeed = " + randomSpeed);
    motor2.forward(randomSpeed);
    motor1.forward(randomSpeed);
    moving = true;

    // After a random duration at this speed in this direction, rotate and start again
    commands.push("_rotate");
    commandParams.push([randomDirection, 0, randomRotate, randomSpeed]);
    commands.push("_walkAbout");
    commandParams.push([]);

    setTimeout(_executeCommands, randomDuration);

} // function _walkAbout() {

function _rotate(direction, duration, degrees, speed) {
    console.log("%%%%%%% starting rotate, degrees = " + degrees + ", speed = " + speed);
    // If direction is blank, stop
    if (direction == null) {
        //_allStop();
        motor1.stop();
        motor2.stop();
        rotating = false;
        _executeCommands();
    } else {
        var tempSpeed = motorSpeed;
        if (speed != null) {
            if (speed > 0) {
                tempSpeed = speed;
            }
        }

        var tempDuration = 0;
        // If degrees are set, calculate duration from speed
        if (degrees != null) {
            if (degrees > 360) {
                degrees = 360;
            } else if (degrees < 0) {
                degrees = 0;
            }

            // Calculate duration given speed and degrees
            tempDuration = (242521.3 * Math.pow(tempSpeed, -2.113871)) * degrees
        }

        // If duration or degress are set, then set a timeout of when to stop
        if (duration != null && tempDuration == 0) {
            tempDuration = duration;
        }

        // recursively call with blank direction to stop after a period of time
        if (tempDuration > 0) {
            setTimeout(_rotate, tempDuration);
        }

        if (direction == LEFT) {
            motor1.forward(tempSpeed);
            motor2.reverse(tempSpeed);
        } else {
            motor2.forward(tempSpeed);
            motor1.reverse(tempSpeed);
        }
        rotating = true;
    }

} // function _rotate() {

function _doneSpeaking() {
    eyes.stop().off();
    speechAnimation.stop();
    speaking = false;
    clearTimeout(_doneSpeaking);
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
    var speakingDuration = wordList.length * 310;
    setTimeout(_doneSpeaking, speakingDuration);

    speaking = true;
    // Start strobing the eye leds
    eyes.strobe(150);

    try {
        speechAnimation.enqueue({
            duration: 2000,
            cuePoints: [0, 0.25, 0.5, 0.75, 1.0],
            keyFrames:
                [
                    [{ degrees: headStartPos }, { degrees: 50 }, { degrees: 130 }, { degrees: 65 }, { degrees: headStartPos }],
                    [{ degrees: armStartPos }, { degrees: 95 }, { degrees: 140 }, { degrees: 100 }, { degrees: armStartPos }]
                ],
            loop: true,
            onstop: function () {
                //console.log("Animation stopped");
                //Use onstop functions when your looping animation is halted to return a bot's animated limbs to their home positions.
                //Nearly always use null as the first value in an animation segment. It allows the segment to be started from a variety of positions.
            },
            oncomplete: function () {
                //console.log("Animation complete");
            }
        });
    }
    catch (error) {
        console.error(">>> speechAnimation error = " + error);
    }
}

function _allStop() {
    motor1.stop();
    motor2.stop();
    moving = false;
    rotating = false;
    _doneSpeaking();
    walkAbout = false;
    // Clear out the command queue
    commands.length = 0;
    commandParams.length = 0;
    // Clear the function calls
    clearTimeout(_executeCommands);
    clearTimeout(_slowAndStop);
    clearTimeout(_rotate);
}

//=============================================================================================
// Execution controller for multiple commands
// Commands and parameters are pushed into arrays, and after every command completes it
// calls this function to see if there is another command to execute
//=============================================================================================
function _executeCommands() {
    if (commands.length < 1) {
        return;
    }

    // Pop the command and parameters off the beginning of the arrays
    var command = commands.shift();
    var params = commandParams.shift();

    console.log(dateTime.create().format('H:M:S.N') + ", _executeCommands, command = " + command);

    // Execute the specified command with the parameters
    if (command == "_slowAndStop") {
        _slowAndStop();
    } else if (command == "_rotate") {
        _rotate(params[0], params[1], params[2], params[3]);
    } else if (command == "_walkAbout") {
        _walkAbout();
    }

} // function _executeCommands() {

function _getRandomInt(min, max) {
    // Floor - rounded down to the nearest integer
    return Math.floor(Math.random() * (max - min)) + min;
}

module.exports = {
    botEvent,
    command
};
