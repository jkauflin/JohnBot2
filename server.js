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
2018-05-20 JJK  Finally got speech recognition text send working
2018-05-27 JJK  Working on data load and full-text-search
2018-09-02 JJK  Checking capabilities
2018-12-06 JJK  Implemented HTTPS and ws using the HTTPS server

"johnny-five": "latest",
"sound-player": "latest",

2018-12-08 JJK  Working on implementing STT/TTS with google web services
=============================================================================*/

// Read environment variables from the .env file
require('dotenv').config();
//HOST=
//WEB_PORT=
//WS_PORT=
//BOT_DATA_URL=
//UID=
//STORE_DIR=

// General handler for any uncaught exceptions
process.on('uncaughtException', function (e) {
	console.log("UncaughtException, error = "+e);
  console.error(e.stack);
  //if (ws.isAlive) {
  //  var serverMessage = {"errorMessage" : "UncaughtException, error = "+e.message};
  //  ws.send(serverMessage);
  //}

  // Stop the process
  // 2017-12-29 JJK - Don't stop for now, just log the error
	//process.exit(1);
});

// Create a web server
var express = require('express');
var app = express();

/*
const http = require('http');
const webServer = new http.createServer(app)
  .listen(process.env.WEB_PORT, function () {
    console.log("Live at Port " + process.env.WEB_PORT + " - Let's rock!");
  })
*/
var https = require('https')
var fs = require('fs');
const webServer = new https.createServer({
  key: fs.readFileSync('ssl/johnbot.key'),
  cert: fs.readFileSync('ssl/johnbot.crt')
}, app)
  .listen(process.env.WEB_PORT, function () {
    console.log("Live at Port " + process.env.WEB_PORT + " - Let's rock!");
})

const url = require('url');
var dateTime = require('node-datetime');
//var dataFunctions = require('./dataFunctions.js');
//var audioFunctions = require('./audioFunctions.js');
//var botFunctions = require('./botFunctions.js');
var dataLoaded = false;

//=================================================================================================
// Create a WebSocket server and implement a heartbeat check
//=================================================================================================
const ws = require('ws');
// WebSocket URL to give to the client browser to establish ws connection
//const wsUrl = "ws://" + process.env.HOST + ":" + process.env.WS_PORT;
const wsUrl = "wss://" + process.env.HOST + ":" + process.env.WS_PORT;
const webSocketServer = new ws.Server({ port: process.env.WS_PORT, webServer, perMessageDeflate: false });

// Initialize to false at the start
ws.isAlive = false;
function heartbeat() {
  // If successful heartbeat call, set to true
  this.isAlive = true;
}

// Ping to monitor the websocket connection and terminate ws if no longer alive
const interval = setInterval(function ping() {
  webSocketServer.clients.forEach(function each(ws) {
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
webSocketServer.on('connection', function (ws) {
  // Set to true after getting a successfuly connection from a web client
  ws.isAlive = true;
  // If you get a pong response from a client call the heartbeat function to set a variable
  // showing the connection is still alive
  ws.on('pong', heartbeat);

  /* Broadcast example
  webSocketServer.clients.forEach(function each(client) {
    if (client.readyState === ws.OPEN) {
      client.send(data);
    }
  });
  */

  // Handle messages from the client browser
  ws.on('message', function (botMessageStr) {
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
    if (botMessage.inSpeechText != null) {
      // TEST audio functions
      //audioFunctions.speakText(botMessage.inSpeechText);

      dataFunctions.searchResponses(botMessage.inSpeechText, function (results) {
        console.log("searchResponse, results = "+results);
        var serverMessage = { "textToSpeak": results };
        ws.send(JSON.stringify(serverMessage));
      });

    } else if (botMessage.loadData != null) {
      dataFunctions.loadData('', function(error,response,status) {
      });
    } else if (botMessage.searchStr != null) {
        dataFunctions.searchResponses(botMessage.searchStr, function(results) {
        //console.log("return from searchResponses "+dateTime.create().format('Y-m-d H:M:S'));
        //console.log(results);
        //audioFunctions.speakText(results);
        audioFunctions.speakText(botMessage.searchStr);
      });

    } else {
      //botFunctions.manualControl(botMessage);
    }
  })

  /*
  // Register event listeners for the bot events
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
  */

});

/*
app.use(function(req, res, next) {
    // allow any cross origin access - check on how to limit this
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
*/

// When the web browser client requests a "/start" URL, send back the url to use to establish
// the Websocket connection
// Use /start as a trigger to start any robot functions, like a hello sequence
app.get('/start', function (req, res, next) {
  res.send(wsUrl);
})
   
app.use('/',express.static('public'));

app.use("*",function(req,res){
  console.log("Not in Public, URL = "+req.url);
  res.sendFile(path + "404.html");
});
 
// jjk new
app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})

