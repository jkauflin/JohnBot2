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
display of the proximity values for the web page
action to take for close proximity

2018-12-01 JJK  Updated to johnny-five 1.0.0
2018-12-21 JJK  Getting the robot function working again
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
const LEFT_EYE = 44;
const RIGHT_EYE = 45;
const ARM_SERVO = 9;
const HEAD_SERVO = 10;
const PROXIMITY_PIN = 7;

// create EventEmitter object
var botEvent = new EventEmitter();

// Event Namespace
//var RoboEvents = {};
var leftEyeLed;
var rightEyeLed;
var motorConfig = five.Motor.SHIELD_CONFIGS.ADAFRUIT_V2;
var motor1;
var motor2;
var motorSpeed = 100;
var headServo;
var armServo;
var proximity;
var currProx = 0;
var prevProx = 0;
var armAnimation;
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

  // Strobe the pin on/off, defaults to 100ms phases
  //led.strobe();
/*  
  led.fade({
  easing: "outSine",
  duration: 1000,
  cuePoints: [0, 0.2, 0.4, 0.6, 0.8, 1],
  keyFrames: [0, 250, 25, 150, 100, 125],
  onstop: function() {
    console.log("Animation stopped");
  }
*/
  // "blink" the led in 500ms
  // on-off phase periods
  //led.blink(700);  
  //led2.blink(700);
  
 // Initialize a Servo collection
 /*
  var servos = new five.Servos([9, 10]);
  servos.center();  
  servos.stop();
*/

  headServo = new five.Servo({
    id: "HeadServo",     // User defined id
    pin: HEAD_SERVO, // Which pin is it attached to?
    type: "standard",  // Default: "standard". Use "continuous" for continuous rotation servos
    range: [10,170],    // Default: 0-180
    fps: 100,          // Used to calculate rate of movement between positions
    invert: false,     // Invert all specified positions
    //startAt: 90,       // Immediately move to a degree
    center: true,      // overrides startAt if true and moves the servo to the center of the range
  });

  armServo = new five.Servo({
    id: "ArmServo",     // User defined id
    pin: ARM_SERVO, // Which pin is it attached to?
    type: "standard",  // Default: "standard". Use "continuous" for continuous rotation servos
    range: [10,170],    // Default: 0-180
    fps: 100,          // Used to calculate rate of movement between positions
    invert: false,     // Invert all specified positions
    //startAt: 90,       // Immediately move to a degree
    center: true,      // overrides startAt if true and moves the servo to the center of the range
  });

  armAnimation = new five.Animation(armServo);


  //headServo.to(120);
  // Sweep from 0-180.
  //headServo.sweep();

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

function manualControl(botMessage) {
  if (botMessage.motorSpeed != null) {
    motorSpeed = botMessage.motorSpeed;
  }
  if (botMessage.armPosition != null) {
    armServo.to(botMessage.armPosition);
    /*
    armAnimation.enqueue({
      duration: 500,
      cuePoints: [0, 1.0],
      keyFrames: [ {degrees: currArmPos}, {degrees: botMessage.armPosition}]
    });
    */
    currArmPos = botMessage.armPosition;

  }
  if (botMessage.headPosition != null) {
    headServo.to(botMessage.headPosition);

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
    if (botMessage.rotateDirection != null) {
      rotateDirection = botMessage.rotateDirection;
    }
    if (botMessage.rotate) {
      if (rotateDirection == LEFT_DIRECTION) {
        motor1.forward(motorSpeed);
        motor2.reverse(motorSpeed);
      } else {
        motor2.forward(motorSpeed);
        motor1.reverse(motorSpeed);
      }
      rotating = true;
    } else {
      motor1.stop();
      motor2.stop();
      rotating = false;
    }
  }

  if (botMessage.eyes != null) {
    //console.log("botMessage.eyes = "+botMessage.eyes);
    if (botMessage.eyes) {
      leftEyeLed.on();
      rightEyeLed.on();
      eyesOn = true;

      /*
      armAnimation.enqueue({
        duration: 2000,
        cuePoints: [0, 0.25, 0.5, 0.75, 1.0],
        keyFrames: [ {degrees: 90}, {degrees: 130}, {degrees: 45}, {degrees: 120}, {degrees: 90}]
      });
      */

    } else {
      leftEyeLed.off();
      rightEyeLed.off();
      eyesOn = false;
    }
    
  }

  if (botMessage.voice != null) {
    //console.log("botMessage.voice = "+botMessage.voice);
    if (botMessage.voice) {
      // turn on voice (or start playing a random sound clip)
    } else {
      // turn off voice (stop playing sound clip)
    }
  }
  
} // function manualControl(botMessage) {

function testBot(testStr,callback){
    console.log("in testBot "+dateTime.create().format('Y-m-d H:M:S'));
        callback("back");
    
}; // 

module.exports = {
    testBot,
    botEvent,
    manualControl
};

// make the motor objects global in this module, then expose functions that use them
/*
exports.forward = function(){
  console.log('moving forward');

  //hack for the direction issue
  leftFront.reverse(255);
  rightFront.reverse(255);
}
*/
