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

const FORWARD_DIRECTION = 'F';
const BACKWARD_DIRECTION = 'R';
const RIGHT_DIRECTION = 'R';
const LEFT_DIRECTION = 'L';

var moveDirection = FORWARD_DIRECTION;
var moving = false;
var rotateDirection = RIGHT_DIRECTION;
var rotating = false;
var eyesOn = false;

board.on("error", function() {
  //console.log("*** Error in Board ***");
  botEvent.emit("error", "*** Error in Board ***");
}); // board.on("error", function() {
  

// When the board is ready, create and intialize global component objects (to be used by functions)
board.on("ready", function() {
  console.log("*** board ready ***");

  proximity = new five.Proximity({
    controller: "HCSR04",
    pin: PROXIMITY_PIN
  });

  proximity.on("data", function() {
    if (this.in < 12.0) {
      // Send event message for change in proximity inches
      currProx = Math.round(this.in);
      if (currProx != prevProx) {
        botEvent.emit("proxIn", currProx);
        //console.log("Proximity: " + currProx);
        prevProx = currProx;
      }
      //console.log("Proximity: " + this.in);
      if (this.in < 4.0) {
        // Take action on close proximity
        //    stop if moving, and say something
        //console.log("Proximity: "+this.in);
        // stop and turn around
      }
    }
  });

  /*
  proximity.on("change", function() {
    console.log("The obstruction has moved.");
  });
  */
  
  // Create an Led on pin 13
  leftEyeLed = new five.Led(LEFT_EYE);
  rightEyeLed = new five.Led(RIGHT_EYE);
  eyes = new five.Leds([leftEyeLed, rightEyeLed]);

 // Initialize the Head and Arm servos
  headServo = new five.Servo({
    id: "HeadServo",        // User defined id
    pin: HEAD_SERVO,        // Which pin is it attached to?
    type: "standard",       // Default: "standard". Use "continuous" for continuous rotation servos
    range: [10,170],        // Default: 0-180
    fps: 100,               // Used to calculate rate of movement between positions
    invert: false,          // Invert all specified positions
    startAt: headStartPos,  // Immediately move to a degree
    //center: true,         // overrides startAt if true and moves the servo to the center of the range
  });

  armServo = new five.Servo({
    id: "ArmServo",         // User defined id
    pin: ARM_SERVO,         // Which pin is it attached to?
    type: "standard",       // Default: "standard". Use "continuous" for continuous rotation servos
    range: [10,170],        // Default: 0-180
    fps: 100,               // Used to calculate rate of movement between positions
    invert: false,          // Invert all specified positions
    startAt: armStartPos,   // Immediately move to a degree
    //center: true,         // overrides startAt if true and moves the servo to the center of the range
  });

  // Create a animation for the head and arm
  headAndArm = new five.Servos([headServo,armServo]);
  speechAnimation = new five.Animation(headAndArm);

  // Initialize the legs
  motor1 = new five.Motor(motorConfig.M1);
  motor2 = new five.Motor(motorConfig.M2);

  // Start the motor at maximum speed
  //motor2.forward(200);
  //motor1.forward(200);
//.reverse
//.stop
// parameter speed - 255 max
  
//});

}); // board.on("ready", function() {

function control(botMessage) {
  console.log(dateTime.create().format('H:M:S.N') + ", botMessage = " + JSON.stringify(botMessage));

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
      if (moveDirection == BACKWARD_DIRECTION) {
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

  if (botMessage.rotate != null) {
    if (botMessage.rotate) {
      var direction = RIGHT_DIRECTION;
      if (botMessage.rotateDirection != null) {
        direction = botMessage.rotateDirection;
      }

      _rotate(direction, botMessage.rotateDuration, botMessage.rotateDegrees, botMessage.rotateSpeed);

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

  if (botMessage._doneSpeaking) {
    // When done speaking, turn the speaking animation off
    //console.log("in botFunctions, message = _doneSpeaking");
    // 1/30/2019 - turn off in favor of just handling the timing in botFunctions
    //_doneSpeaking();
  }

} // function control(botMessage) {

function _rotate(direction,duration,degrees,speed) {
  // If direction is blank, stop
  if (direction == null) {
    motor1.stop();
    motor2.stop();
    rotating = false;
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
      // tempDuration = degrees * tempSpeed;

      // make sure degrees is positive > 0?

      if (degrees > 360) {
        degrees = 360;
      } else if (degrees < 0) {
        degrees = 0;
      }

      tempDuration = (242521.3 * Math.pow(motorSpeed, -2.113871)) * degrees

    }

    // If duration or degress are set, then set a timeout of when to stop
    if (duration != null && tempDuration == 0) {
      tempDuration = duration;
    }

    // recursively call with blank direction to stop after a period of time
    if (tempDuration > 0) {
      setTimeout(_rotate, tempDuration);
    }

    if (direction == LEFT_DIRECTION) {
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

function _allStop() {
  motor1.stop();
  motor2.stop();
  moving = false;
  rotating = false;
  _doneSpeaking();
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
          [{ degrees: headStartPos }, { degrees: 50 }, { degrees: 130 }, { degrees: 65 }, { degrees: headStartPos}],
          [{ degrees: armStartPos }, { degrees: 95 }, { degrees: 140 }, { degrees: 100 }, { degrees: armStartPos}]
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

module.exports = {
    botEvent,
    control
};
