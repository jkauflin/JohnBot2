/*==============================================================================
(C) Copyright 2017,2018,2019,2022 John J Kauflin, All rights reserved. 
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
2018-12-08 JJK  Working on implementing STT/TTS with google web services
2018-12-12 JJK  Finally got HTTPS and trusted certificates working
2018-12-13 JJK  Finally got wss secure websocket working over the HTTPS 
                server (being called from the app running at ISP)
2018-12-21 JJK  Getting Johnny-Five and the robot working again
                Introducing an activity loop to check state and timings, 
                and trigger activities
2018-12-26 JJK  Got some speech animation working again
2019-01-20 JJK  Modified to pass envStr on start with url's and UID.
                Shifted text from speech handling back to client browser,
                just telling the robot to start animating the text being
                spoken
2019-02-02 JJK  Ran this to turn off package-lock.json creation:
                  npm config set package-lock false
2019-03-16 JJK  Separated the Chatbot part to another repository and have
                this just be the server to handle web socket commands for
                the robotic part (not the web browser part)
2019-09-22 JJK  Checking functions
2021-10-09 JJK  Re-looking at the JohnBot - turning off the connection to
                chatbot and reworking the loops for sensors
2022-05-01 JJK  Ok, back to JohnBot - newest OS (Buster) and starting to 
                re-check functions
=============================================================================*/

// General handler for any uncaught exceptions
process.on('uncaughtException', function (err) {
    console.log("UncaughtException, error = " + err);
    console.error(err.stack);
    // Exit the process (so that Forever will re-start and reset the board)
    process.exit(1);
});

// Read environment variables from the .env file
require('dotenv').config();
//HOST=
//WEB_PORT=
//BOT_WEB_URL=
//UID=
//SSL_PRIVATE_KEY_FILE_LOC=
//SSL_PUBLIC_CERT_FILE_LOC=

/*
const os = require('os');
//console.log("os.hostname = " + os.hostname);
const http = require('http');
const https = require('https')
const fs = require('fs');
//var getJSON = require('get-json');
//const url = require('url');
var dateTime = require('node-datetime');

// WebSocket URL to give to the client browser to establish ws connection
var wsUrl;
var webServer;

// If running local server just use HTTP, else use HTTPS
if (process.env.HOST == "localhost") {
    wsUrl = "ws://" + process.env.HOST + ":" + process.env.WEB_PORT;
    webServer = new http.createServer()
        .listen(process.env.HTTP_PORT, function () {
            console.log("HTTP WS server Live at Port " + process.env.WEB_PORT + " - Let's rock!");
        });
} else {
    wsUrl = "wss://" + process.env.HOST + ":" + process.env.WEB_PORT;
    webServer = new https.createServer({
        // Key and certificate that have been signed by a CA root authority installed on server
        key: fs.readFileSync(process.env.SSL_PRIVATE_KEY_FILE_LOC),
        cert: fs.readFileSync(process.env.SSL_PUBLIC_CERT_FILE_LOC)
    })
        .listen(process.env.WEB_PORT, function () {
            console.log("HTTPS WS server Live at Port " + process.env.WEB_PORT + " - Let's rock!");
        });
}

//}, app)
*/

//var dataFunctions = require('./dataFunctions.js');
//var dataLoaded = false;
//var audioFunctions = require('./audioFunctions.js');

var botFunctions = require('./botFunctions.js');


//=================================================================================================
// Create a WebSocket server and implement a heartbeat check
//=================================================================================================
/*
const ws = require('ws');

const webSocketServer = new ws.Server({ server: webServer, perMessageDeflate: false});

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

    // General function to send a message from the bot to the connected browser client
    function _wsSend(serverMessage) {
        // Make sure the web socket is connected before trying to send the message
        if (ws.isAlive == true) {
            // JJK - you can either construct it as a string and send with no JSON.stringify
            //       or construct a JSON object, with easier syntax, and then you have to stringify it
            try {
                ws.send(JSON.stringify(serverMessage));
            } catch (error) {
                // Ignore errors - just log to the console
                console.error("Error in ws send to client, err = " + error);
            }

        } else {
            console.log("Error trying to send ws message = " + JSON.stringify(serverMessage));
        }
    }

    // Handle messages from the client browser
    ws.on('message', function (botMessageStr) {
        //console.log(dateTime.create().format('H:M:S.N') + ", botMessageStr = "+botMessageStr);
        // Use JSON.parse to turn the string into a JSON object
        var botMessage = JSON.parse(botMessageStr);
        // Send the message object to the botFunctions module
        botFunctions.command(botMessage);
    });

    // Register event listeners for the bot events
    botFunctions.botEvent.on("error", function (errorMessage) {
        _wsSend({ "errorMessage": errorMessage });
    });

    botFunctions.botEvent.on("proxIn", function (proxIn) {
        _wsSend({ "proxIn": proxIn });
    });
   
  // When initiating speech from the robot, send to browser client to speak
  // and to robot to animate
  //?????
  // Hey, I've hit a wall - someone help me

}); // End of Connection to client
*/