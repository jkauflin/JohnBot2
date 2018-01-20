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
=============================================================================*/
var five = require("johnny-five");
var dateTime = require('node-datetime');
const EventEmitter = require('events');
var board = new five.Board();
//var dt = dateTime.create();
//var formatted = dt.format('Y-m-d H:M:S');

// Constants for pin numbers
const LEFT_EYE = 44;
const RIGHT_EYE = 45;
const SERVO_1_ARM = 10;
const SERVO_2_HEAD = 9;

// create EventEmitter object
var thermometerEvent = new EventEmitter();

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

var moving = false;
var rotating = false;

// When the board is ready, create and intialize global component objects (to be used by functions)
board.on("ready", function() {
  // This requires OneWire support using the ConfigurableFirmata
  /*
  var thermometer = new five.Thermometer({
    controller: "DS18B20",
    pin: 2
  });
  thermometer.on("change", function() {
    //console.log(dateTime.create().format('H:M:S.N')+"  Tempature = "+this.fahrenheit + "°F");
    thermometerEvent.emit("tempatureChange", this.fahrenheit);
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
  pin: SERVO_2_HEAD, // Which pin is it attached to?
  type: "standard",  // Default: "standard". Use "continuous" for continuous rotation servos
  range: [0,180],    // Default: 0-180
  fps: 100,          // Used to calculate rate of movement between positions
  invert: false,     // Invert all specified positions
  //startAt: 90,       // Immediately move to a degree
  center: true,      // overrides startAt if true and moves the servo to the center of the range
});

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
  //leftEyeLed.on();
  /*
  botMessage.moveDirection" : "F",
  botMessage.move" : 1,
  botMessage.rotateDirection" : "R",
  botMessage.rotate" : 0,
  botMessage.eyes" : 0,
  botMessage.motorSpeed" : 100,
  botMessage.armPosition" : 90,
  botMessage.headPosition" : 90
  */

  if (botMessage.eyes) {
    leftEyeLed.on();
  } else {
    leftEyeLed.off();
  }

}


function testBot(testStr,callback){
    console.log("in testBot "+dateTime.create().format('Y-m-d H:M:S'));
        callback("back");
    
}; // 

module.exports = {
    testBot,
    manualControl,
    thermometerEvent
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
