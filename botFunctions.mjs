/*==============================================================================
(C) Copyright 2017,2018,2019,2020,2022 John J Kauflin, All rights reserved. 
-----------------------------------------------------------------------------
DESCRIPTION: NodeJS module to handle robot functions.  Communicates with
             the Arduino Mega, and accepts commands from user input
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
2020-05-30 JJK  Working on distance sensor accuracy by adding smoothing
2021-10-09 JJK  Re-looking at the JohnBot - turning off the connection to
                chatbot and reworking the loops for sensors
2022-05-01 JJK  Ok, back to JohnBot - newest OS (Buster) and starting to 
                re-check functions
2023-11-07 JJK  Getting bot functions working under new OS (Bookworm) in 
                an ESM module, and trying new infrared proximity sensor
=============================================================================*/
import johnnyFivePkg from 'johnny-five' // Library to control the Arduino board
import {log} from './util.mjs'          // My utility functions

const {Board,Led,Leds,Relays,Proximity} = johnnyFivePkg

var board = null
var relays = null

// Constants for pin numbers and commands
const LEFT_EYE = 45;
const RIGHT_EYE = 44;

var eyes;
var leftEyeLed;
var rightEyeLed;
var eyesOn = false;

var speaking = false;

// Create Johnny-Five board object
// When running Johnny-Five programs as a sub-process (eg. init.d, or npm scripts), 
// be sure to shut the REPL off!
try {
    log("===== Starting board initialization =====")
    board = new Board({
        repl: false,
        debug: false
        //    timeout: 12000
    })
} catch (err) {
    log('Error in main initialization, err = ' + err)
    console.error(err.stack)
}

board.on("error", function (err) {
    log("*** Error in Board ***")
    console.error(err.stack)
})

//-------------------------------------------------------------------------------------------------------
// When the board is ready, create and intialize global component objects (to be used by functions)
//-------------------------------------------------------------------------------------------------------
board.on("ready", () => {
    log("*** board ready ***")

    // If the board is exiting, execute cleanup actions
    process.on("exit", function () {
        log("on EXIT")
        allStop()
    })
    // Handle a termination signal
    process.on('SIGTERM', function () {
        log('on SIGTERM')
        allStop()
    })

    leftEyeLed = new Led(LEFT_EYE);
    rightEyeLed = new Led(RIGHT_EYE);
    eyes = new Leds([leftEyeLed, rightEyeLed]);
    //eyes.on();
    //eyes.off();
    //eyes.strobe(150);

    /*
    new five.Proximity({
      controller: "GP2Y0A21YK",
      pin: "A8"
    });
    */
    
    // Start the function to toggle air ventilation ON and OFF
    /*
    log("Starting Air toggle interval")
    setTimeout(toggleAir, 5000)
    // Start sending metrics 10 seconds after starting (so things are calm)
    setTimeout(logMetric, 10000)
    */

    log("End of board.on (initialize) event")
})


export function allStop() {
    log(">>>>> bot - ALL STOP");

    // Stop all motion
    //_stopWalking();
    // Stop all components
    _doneSpeaking();

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

function _getRandomInt(min, max) {
    // Floor - rounded down to the nearest integer
    return Math.floor(Math.random() * (max - min)) + min;
}


export function animateSpeech(textToSpeak) {
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
