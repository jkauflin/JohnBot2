/*==============================================================================
(C) Copyright 2017 John J Kauflin, All rights reserved. 
-----------------------------------------------------------------------------
DESCRIPTION: NodeJS server for JohnBot2 to run a web app and the
             communications to the Arduino Mega robot
-----------------------------------------------------------------------------
Modification History
2017-09-23 JJK  Initial version to test web app and connection to arduino
2017-10-10 JJK  Got Johnny-Five working to control the arduino functions
2017-11-12 JJK  Got the Elasticsearch data source working for responses
2017-12-03 JJK  Got audio functions working for TTS and playing MP3's
				Implementing tableinfo with update timestamp
2017-12-22 JJK  Finishing up data table load logic
2017-12-26 JJK  Finally got the two table loads working
2017-12-27 JJK  Starting to test WebSocket
2017-12-29 JJK  Got WebSocket, and slider working
2017-12-31 JJK  Loaded StandardFirmataPlus on the Arduino Mega and am
                testing functions
                Loaded ConfigurableFirmata (needed for tempature sensor
                using OneWire communication)
2018-01-04 JJK  Added dotenv to set environment variables and abstract
                literals
                Added heartbeat check for websocket connections
                NODE_ENV=development
2018-01-20 JJK  Implemented handling for manual control WebSocket 
                messages from the client
2018-02-07 JJK  Got working on Pi zero w
2018-02-10 JJK  Adding display of proximity values
2018-02-22 JJK  Redoing dataFunctions using full-text-search
2018-04-03 JJK  Working on audio functions (bluetooth speaker)
2018-04-23 JJK  Got bluetooth and pico-speaker working
2018-04-25 JJK  Working on web inputs
2018-05-09 JJK  Accept speech text
=============================================================================*/

// Read environment variables from the .env file
require('dotenv').config();
//HOST=
//WEB_PORT=
//WS_PORT=
//BOT_DATA_URL=

// General handler for any uncaught exceptions
process.on('uncaughtException', function (e) {
	console.log("UncaughtException, error = "+e);
  console.error(e.stack);
  if (ws.isAlive) {
    //var serverMessage = {"errorMessage" : "UncaughtException, error = "+e.message};
    //ws.send(serverMessage);
  }
  // Stop the process
  // 2017-12-29 JJK - Don't stop for now, just log the error
	//process.exit(1);
});

/*
UncaughtException, error = Error: Uncaught, unspecified "error" event. ([object Object])
Error: Uncaught, unspecified "error" event. ([object Object])
    at Board.emit (events.js:163:17)
    at Board.log (C:\Users\jjkaufl\Downloads\Projects\JohnBot2\node_modules\johnny-five\lib\board.js:630:8)
    at Board.(anonymous function) [as error] (C:\Users\jjkaufl\Downloads\Projects\JohnBot2\node_modules\johnny-five\lib\board.js:641:14)
    at Board.<anonymous> (C:\Users\jjkaufl\Downloads\Projects\JohnBot2\node_modules\johnny-five\lib\board.js:385:14)
    at ontimeout (timers.js:386:14)
    at tryOnTimeout (timers.js:250:5)
    at Timer.listOnTimeout (timers.js:214:5)
*/

const express = require('express');
const http = require('http');

const url = require('url');
var dateTime = require('node-datetime');
var botFunctions = require('./botFunctions.js');
var audioFunctions = require('./audioFunctions.js');
//var dataFunctions = require('./dataFunctions.js');
var dataLoaded = false;

var app = express();
//var router = express.Router();
//var path = __dirname + '/views/';
var path = __dirname + '/';

var httpServer = http.createServer(app);


//=================================================================================================
// Create a WebSocket server and implement a heartbeat check
//=================================================================================================
const ws = require('ws');
const wss = new ws.Server({ port: process.env.WS_PORT, perMessageDeflate: false });
// WebSocket URL to give to the client browser to establish ws connection
const wsUrl = "ws://"+process.env.HOST+":"+process.env.WS_PORT;

// Initialize to false at the start
ws.isAlive = false;
function heartbeat() {
  // If successful heartbeat call, set to true
  this.isAlive = true;
}

const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    //console.log(dateTime.create().format('Y-m-d H:M:S')+" In the ping, ws.readyState = "+ws.readyState);
    if (ws.isAlive === false) {
      return ws.terminate();
    }
    // Reset to false and request a ping (the pong response will set isAlive to true again)
    ws.isAlive = false;
    ws.ping('', false, true);
  });
}, 30000);

//=================================================================================================
// Successful connection from a web client
//=================================================================================================
wss.on('connection', function (ws) {
  // Set to true after getting a successfuly connection from a web client
  ws.isAlive = true;
  // If you get a pong response from a client call the heartbeat function to set a variable
  // showing the connection is still alive
  ws.on('pong', heartbeat);

  /* Broadcast example
  wss.clients.forEach(function each(client) {
    if (client.readyState === ws.OPEN) {
      client.send(data);
    }
  });
  */



  // Handle messages from the client browser
  ws.on('message', function (botMessageStr) {
    // console.log('received from client: %s', message)
    // check for manual controls and call function
    //botMessage.
    /*
    "moveDirection" : "F",
    "move" : 1,
    "rotateDirection" : "R",
    "rotate" : 0,
    "eyes" : 0,
    "motorSpeed" : 100,
    "armPosition" : 90,
    "headPosition" : 90

  botMessage.moveDirection" : "F",
  botMessage.move" : 1,
  botMessage.rotateDirection" : "R",
  botMessage.rotate" : 0,
  botMessage.eyes" : 0,
  botMessage.motorSpeed" : 100,
  botMessage.armPosition" : 90,
  botMessage.headPosition" : 90
    */
    
    console.log("botMessageStr = "+botMessageStr);
    // Use JSON.parse to turn the string into a JSON object
    var botMessage = JSON.parse(botMessageStr);
    if (botMessage.searchStr != null) {
      audioFunctions.speakText(botMessage.searchStr);
    } else {
      //botFunctions.manualControl(botMessage);
    }
  })


  // Register event listeners for the bot events
  /*
  botFunctions.botEvent.on("tempatureChange", function(fahrenheit) {
    // process data when someEvent occurs
    //console.log(dateTime.create().format('H:M:S.N')+" in Server, Tempature = "+fahrenheit + "°F");
    ws.send(fahrenheit);
  });
  */
 
  botFunctions.botEvent.on("error", function(errorMessage) {
    // JJK - you can either construct it as a string and send with no JSON.stringify
    //       or construct a JSON object, with easier syntax, and then you have to stringify it
    var serverMessage = {"errorMessage" : errorMessage};
    ws.send(JSON.stringify(serverMessage));
  });

  botFunctions.botEvent.on("proxIn", function(proxIn) {
    // JJK - you can either construct it as a string and send with no JSON.stringify
    //       or construct a JSON object, with easier syntax, and then you have to stringify it
    var serverMessage = {"proxIn" : proxIn};
    ws.send(JSON.stringify(serverMessage));
  });


  /*
  setInterval(
    sendDate,
    1000,ws)
  */
});

  //botFunctions.testLed();

// test send data to client
function sendDate(ws) {
  try { 

    ws.send(dateTime.create().format('Y-m-d H:M:S'),
    
      function ack(error) {
        // If error is not defined, the send has been completed, otherwise the error
        // object will indicate what failed.
        if (error == null) {
          // send successful
          //console.log("Successful send in sendDate ");
        } else {
          console.log("error object indicates ERROR in ws.send  - sendDate");
        }
      }

    );

  } catch (e) {
    console.log("ERROR in try/catch for WebSocket - sendDate, e = "+e);
  }

}

// When the web browser client requests a "/start" URL, send back the url to use to establish
// the Websocket connection
// Use /start as a trigger to start any robot functions, like a hello sequence
app.get('/start', function (req, res, next) {
  //console.log("app.get /testcall, searchStr = "+req.query.searchStr);
  var startData = {
    "wsUrl": wsUrl
  };
  res.send(JSON.stringify(startData));
})
   
app.use('/',express.static('public'));

// searchStr to search responses for
// return response

/*
router.use(function (req,res,next) {
  console.log("/" + req.method);
  next();
});
router.get("/",function(req,res){
  //res.sendFile(path + "index.html");
  res.sendFile('index.html', { root: __dirname });
});
router.get("/about",function(req,res){
  res.sendFile(path + "about.html");
});
router.get("/contact",function(req,res){
  res.sendFile(path + "contact.html");
});
app.use("/",router);
*/

app.use("*",function(req,res){
  console.log("Not in Public, URL = "+req.url);
  res.sendFile(path + "404.html");
});

 
// jjk new
app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})

httpServer.listen(process.env.WEB_PORT,function() {
  console.log("Live at Port "+process.env.WEB_PORT+" - Let's rock!");
});


/*
dataFunctions.loadData('', function(error,response,status) {
	if (error == null) {
		dataLoaded = true;
	}
});

//var searchStr = 'do you love me';
var searchStr = 'loki';
//var searchStr = 'zzz';
dataFunctions.searchResponses(searchStr, function(results) {
    console.log("return from searchResponses "+dateTime.create().format('Y-m-d H:M:S'));
	  console.log(results);
	  //audioFunctions.speakText(results);
});
*/

