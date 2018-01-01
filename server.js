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
=============================================================================*/

const express = require('express');
const http = require('http');
const url = require('url');
var dateTime = require('node-datetime');
var botFunctions = require('./botFunctions.js');
var audioFunctions = require('./audioFunctions.js');
var dataFunctions = require('./dataFunctions.js');
var dataLoaded = false;

const WEB_PORT = 3000;
var app = express();
var router = express.Router();
//var path = __dirname + '/views/';
var path = __dirname + '/';

const ws = require('ws');
const wss = new ws.Server({ port: 3035, perMessageDeflate: false });
// WebSocket URL to give to the client browser to establish ws connection
const wsUrl = "ws://localhost:3035";

// General handler for any uncaught exceptions
process.on('uncaughtException', function (e) {
	console.log("UncaughtException, error = "+e);
	console.error(e.stack);
  // Stop the process
  // 2017-12-29 JJK - Don't stop for now, just log the error
	//process.exit(1);
});

  wss.on('connection', function (ws) {

    ws.on('message', function (message) {
      console.log('received from client: %s', message)
    })
    /*
    setInterval(
      sendDate,
      1000,ws)
    */
  })
  
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

app.get('/start', function (req, res, next) {
  //console.log("app.get /testcall, searchStr = "+req.query.searchStr);
  var startData = {
    "wsUrl": wsUrl
  };
  res.send(JSON.stringify(startData));
})
   
app.use(express.static('public'))
 
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
 
app.listen(WEB_PORT,function(){
  console.log("Live at Port 3000 - Let's rock!");
});

/*
dataFunctions.loadData('', function(error,response,status) {
	if (error == null) {
		dataLoaded = true;
	}
});
*/

//var searchStr = 'do you love me';
/*
var searchStr = 'loki';
//var searchStr = 'zzz';
dataFunctions.searchResponses(searchStr, function(results) {
    console.log("return from searchResponses "+dateTime.create().format('Y-m-d H:M:S'));
	console.log(results);
	audioFunctions.speakText(results);
});
*/

console.log("End of server "+dateTime.create().format('Y-m-d H:M:S'));
//dataFunctions.esInfo();

