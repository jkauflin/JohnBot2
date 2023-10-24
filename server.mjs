/*==============================================================================
(C) Copyright 2017,2018,2019,2022,2023 John J Kauflin, All rights reserved. 
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
                Re-implementating a webserver and UI to test functions
                Implementing newest bootstrap 5 ideas
2023-10-22 JJK  Re-do with newest OS (Bookworm) and ES6 modules
                Try Fastify for https web server to handle RESTful API requests
=============================================================================*/

import 'dotenv/config'
import Fastify from 'fastify'
import fs, { readFileSync } from 'node:fs'
import path from 'node:path'
import { syncBuiltinESMExports } from 'node:module'
import { Buffer } from 'node:buffer'
import fetch from 'node-fetch'              // Fetch to make HTTPS calls
import johnnyFivePkg from 'johnny-five'     // Library to control the Arduino board
import {log} from './util.mjs'
//import {getConfig,completeRequest,updImgData} from './dataRepository.mjs'

const fastify = Fastify({
    logger: true,
    // Key and certificate that have been signed by a CA root authority installed on server
    key: fs.readFileSync(process.env.SSL_PRIVATE_KEY_FILE_LOC),
    cert: fs.readFileSync(process.env.SSL_PUBLIC_CERT_FILE_LOC)
})

const {Board,Led,Relays} = johnnyFivePkg

// General handler for any uncaught exceptions
process.on('uncaughtException', function (e) {
  log("UncaughtException, error = " + e);
  console.error(e.stack);
  // Stop the process
  // 2017-12-29 JJK - Don't stop for now, just log the error
  //process.exit(1);
});

var board = null
var relays = null

log(">>> Starting server.mjs...")

/*
const fs = require('node:fs')
const path = require('node:path')
const fastify = require('fastify')({
  http2: true,
  https: {
    allowHTTP1: true, // fallback support for HTTP1
    key: fs.readFileSync(path.join(__dirname, '..', 'https', 'fastify.key')),
    cert: fs.readFileSync(path.join(__dirname, '..', 'https', 'fastify.cert'))
  }
})

// this route can be accessed through both protocols
fastify.get('/', function (request, reply) {
  reply.code(200).send({ hello: 'world' })
})

fastify.listen({ port: 3000 })
*/


// Declare a route
fastify.get('/', async function handler (request, reply) {
    return { hello: 'world' }
})

/*
fastify.route({
    method: 'GET',
    url: '/',
    schema: {
      // request needs to have a querystring with a `name` parameter
      querystring: {
        type: 'object',
        properties: {
            name: { type: 'string'}
        },
        required: ['name'],
      },
      // the response needs to be an object with an `hello` property of type 'string'
      response: {
        200: {
          type: 'object',
          properties: {
            hello: { type: 'string' }
          }
        }
      }
    },
    // this function is executed for every request before the handler is executed
    preHandler: async (request, reply) => {
      // E.g. check authentication
    },
    handler: async (request, reply) => {
      return { hello: 'world' }
    }
})
*/

// Run the server!
try {
    await fastify.listen({ port: process.env.WEB_PORT, host: '0.0.0.0'  })
} catch (err) {
    fastify.log.error(err)
    process.exit(1)
}

// Read environment variables from the .env file
//HOST=
//WEB_PORT=
//BOT_WEB_URL=
//UID=
//SSL_PRIVATE_KEY_FILE_LOC=
//SSL_PUBLIC_CERT_FILE_LOC=


/*
var http = require('http');
//import * as http from 'http';
const express = require('express')
//import express from 'express'

var WEB_PORT = 3035;

// Create a web server
var app = express();
var httpServer = http.createServer(app);

app.use('/',express.static('public'));
app.use(express.json());

// jjk new
app.use(function (err, req, res, next) {
    console.error(err.stack)
    res.status(500).send('Something broke!')
})

// Have the web server listen for requests
httpServer.listen(WEB_PORT,function() {
    log("Live at Port " + WEB_PORT + " - Let's rock!");
});


app.get('/GetValues', function (req, res, next) {
    //res.send(JSON.stringify(boardFunctions.getStoreRec()));
});

app.post('/Water', function (req, res, next) {
    //boardFunctions.water(req.body);
    //res.send('ok');
});
*/



// Create Johnny-Five board object
// When running Johnny-Five programs as a sub-process (eg. init.d, or npm scripts), 
// be sure to shut the REPL off!
/*
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

    process.on('SIGTERM', function () {
        log('on SIGTERM')
        //turnRelaysOFF()
    })

    // Start the function to toggle air ventilation ON and OFF
    log("Starting Air toggle interval")
    setTimeout(toggleAir, 5000)
    // Start sending metrics 10 seconds after starting (so things are calm)
    setTimeout(logMetric, 10000)

    log("End of board.on (initialize) event")
})
*/