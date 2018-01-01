/*==============================================================================
(C) Copyright 2017 John J Kauflin, All rights reserved. 
-----------------------------------------------------------------------------
DESCRIPTION: NodeJS module to handle robot functions.  Communicates with
             the Arduino Mega
-----------------------------------------------------------------------------
Modification History
2017-12-31 JJK  Loaded ConfigurableFirmata on the Arduino Mega.
                LED functions working ok
=============================================================================*/
var five = require("johnny-five");
var dateTime = require('node-datetime');
var board = new five.Board();
//var dt = dateTime.create();
//var formatted = dt.format('Y-m-d H:M:S');

/*
var board = new five.Board({
  samplingInterval: 100,
});

var thermometer = new five.Thermometer({
      controller: "DS18B20",
      pin: 4,
      freq: 1000
});
var hygrometer = new five.Multi({
    controller: "HTU21D",
    freq: 1000
});
*/

board.on("ready", function() {

  // This requires OneWire support using the ConfigurableFirmata
  var thermometer = new five.Thermometer({
    controller: "DS18B20",
    pin: 2
  });
  
  thermometer.on("change", function() {
    //console.log(this.celsius + "°C");
    console.log(this.fahrenheit + "°F");
    // console.log("0x" + this.address.toString(16));
  });
  
  
  // Create an Led on pin 13
  var led = new five.Led(44);
  var led2 = new five.Led(45);

  // Strobe the pin on/off, defaults to 100ms phases
  console.log("Starting LED test");
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
  //led.blink(100);  
  //led2.blink(700);

//  #define LEFT_EYE 44
// #define RIGHT_EYE 45
//#define SERVO_1_PIN 10  ARM
//#define SERVO_2_PIN 9   HEAD

  //console.log("Starting Servo test");
  
 // Initialize a Servo collection
 /*
  var servos = new five.Servos([9, 10]);
  servos.center();  
  
    // Inject the `servo` hardware into
  // the Repl instance's context;
  // allows direct command line access
  this.repl.inject({
    servos: servos
  });
  
  servos.stop();
*/
/*
 var servo = new five.Servo(9);
 this.repl.inject({
    servo: servo
  });
*/
  //servo.to(120);

  // Sweep from 0-180.
  //servo.sweep();

/*
  var configs = five.Motor.SHIELD_CONFIGS.ADAFRUIT_V2;

var motor1 = new five.Motor(configs.M1);
var motor2 = new five.Motor(configs.M2);
*/
//var motor3 = new five.Motor(configs.M3);
//var motor4 = new five.Motor(configs.M4);

//  console.log("Starting Motor test");
/*
var motor = new five.Motor({
    controller: "PCA9685",
    frequency: 200, // Hz
    pins: {
      pwm: 8,
      dir: 9,
      cdir: 10,
    },
  });
*/

  // Start the motor at maximum speed
  //motor2.forward(80);
  //motor1.forward(80);

  
//});

}); // board.on("ready", function() {



function testBot(testStr,callback){
    console.log("in testBot "+dateTime.create().format('Y-m-d H:M:S'));
        callback("back");
    
}; // 


module.exports = {
    testBot
};
