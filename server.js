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
=============================================================================*/

var express = require('express');
var dateTime = require('node-datetime');
//var botFunctions = require('./botFunctions.js');
var audioFunctions = require('./audioFunctions.js');
var dataFunctions = require('./dataFunctions.js');
var dataLoaded = false;

var app = express();
var router = express.Router();
//var path = __dirname + '/views/';
var path = __dirname + '/';

// General handler for any uncaught exceptions
process.on('uncaughtException', function (er) {
	console.log("UncaughtException, error = "+er);
	console.error(er.stack);
	// Stop the process
	process.exit(1);
});

 
app.use(express.static('public'))
 
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
 
/*
app.use("*",function(req,res){
  console.log("Not in Public, URL = "+req.url);
  res.sendFile(path + "404.html");
});
*/
 
// jjk new
app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})
 
app.listen(3000,function(){
  console.log("Live at Port 3000 - Let's rock!");
});

//dataFunctions.loadData('responsesBAD');
dataFunctions.loadData('', function(error,response,status) {
    console.log(" ");
    console.log(dateTime.create().format('Y-m-d H:M:S')+" Callback in server from loadData");
    console.log(dateTime.create().format('Y-m-d H:M:S')+"    error = "+error);
    console.log(dateTime.create().format('Y-m-d H:M:S')+" response = "+response);
    console.log(dateTime.create().format('Y-m-d H:M:S')+"   status = "+status);
    if (error != null) {
        console.log("ERROR in callback");
    }
	if (error == null) {
		dataLoaded = true;
	}
});

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

//console.log("End of server "+dateTime.create().format('Y-m-d H:M:S'));
//dataFunctions.esInfo();

