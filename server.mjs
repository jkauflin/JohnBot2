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
2023-11-05 JJK  Working on audio capture from a USB microphone, and then
                using picovoice for STT
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

import {exec} from 'child_process'
import {Cheetah} from '@picovoice/cheetah-node'
import {Porcupine,BuiltinKeyword} from '@picovoice/porcupine-node'

import NodeMic from 'node-mic';

const endpointDurationSec = 0.2;

log(">>> Starting server.mjs...")

const handle = new Cheetah(process.env.PICOVOICE_ACCESS_KEY);
log("Cheetah version = "+handle.version)

const mic = new NodeMic({
    debug: true,
    rate: 16000,
    channels: 1,
    threshold: 6,
    device: "plughw:1,0"
});

const micInputStream = mic.getAudioStream();

const outputFileStream = fs.createWriteStream('output.raw');
micInputStream.pipe(outputFileStream);

micInputStream.on('data', (audioFrame) => {
    // Do something with the data.
    // data is an audio waveform
    log('>>> in data, sending to cheetah')
    /*
    const [partialTranscript, isEndpoint] = handle.process(audioFrame);
    if (isEndpoint) {
        finalTranscript = handle.flush()
        console.log("Cheetah finalTranscript = "+finalTranscript)
    }
    */
});

micInputStream.on('error', (err) => {
    console.log(`Error: ${err.message}`);
});

micInputStream.on('started', () => {
    console.log('Started');
    setTimeout(() => {
        mic.pause();
    }, 5000);
});

micInputStream.on('stopped', () => {
    console.log('Stopped');
});

micInputStream.on('paused', () => {
    console.log('Paused');
    setTimeout(() => {
        mic.resume();
    }, 5000);
});

micInputStream.on('unpaused', () => {
    console.log('Unpaused');
    setTimeout(() => {
        mic.stop();
    }, 5000);
});

micInputStream.on('silence', () => {
    console.log('Silence');
});

micInputStream.on('exit', (code) => {
    console.log(`Exited with code: ${code}`);
});

mic.start();

/*
const handle = new Porcupine(
    accessKey,
    [BuiltinKeyword.GRASSHOPPER, BuiltinKeyword.BUMBLEBEE],
    [0.5, 0.65]);

// process a single frame of audio
// the keywordIndex provides the index of the keyword detected, or -1 if no keyword was detected
const keywordIndex = handle.process(frame);
*/

/*
const handle = new Cheetah(process.env.PICOVOICE_ACCESS_KEY);

function getNextAudioFrame() {
  // ...
  return audioFrame;
}

while (true) {
    const audioFrame = getNextAudioFrame();
    const [partialTranscript, isEndpoint] = handle.process(audioFrame);
    if (isEndpoint) {
        finalTranscript = handle.flush()
        console.log("finalTranscript = "+finalTranscript)
    }
}
*/

// Constants for pin numbers and commands
const LEFT_EYE = 45;
const RIGHT_EYE = 44;

var eyes;
var leftEyeLed;
var rightEyeLed;

var eyesOn = false;

/*
const fastify = Fastify({
    logger: true,
    http2: true,
    https: {
        allowHTTP1: true, // fallback support for HTTP1
        // Key and certificate that have been signed by a CA root authority installed on server
        key: fs.readFileSync(process.env.SSL_PRIVATE_KEY_FILE_LOC),
        cert: fs.readFileSync(process.env.SSL_PUBLIC_CERT_FILE_LOC)
    }
})
*/

/*
http2: true,
https: {
  // Key and certificate that have been signed by a CA root authority installed on server
  key: fs.readFileSync(process.env.SSL_PRIVATE_KEY_FILE_LOC),
  cert: fs.readFileSync(process.env.SSL_PUBLIC_CERT_FILE_LOC)
}
*/

const {Board,Led,Leds,Relays,Proximity} = johnnyFivePkg

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


/*
fastify.post('/botcmd', async function handler (req, res) {
    let botCommands = req.body
    if (botCommands.say != undefined) {
        speakText(botCommands.say)
    }
    //return { hello: 'world' }
    return
})
*/

// Declare a route
/*
fastify.get('/botcmd', (req, res) => {
    console.log("in /botcmd")
    console.log("in /botcmd, body = "+req.body)
    let botCommands = JSON.parse(req.body)
    if (botCommands.say != undefined) {
    }
   return
})
*/

function speakText(textStr) {
    console.log("in speakText, text = "+textStr)
    //player.stop();
    //player.pause();
    //words = '<volume level=\'60\'><pitch level=\'133\'>' + words + '</pitch></volume>'
    //picoSpeaker.speak("<volume level='15'><pitch level='60'>"+textStr).then(function() {
    //picoSpeaker.speak("<volume level='20'><pitch level='70'>" + textStr).then(function () {
    /*
    picoSpeaker.speak("<volume level='10'><pitch level='60'>" + textStr).then(function () {
        //console.log("done speaking");
        //player.resume();
    }.bind(this));
    */
/*
error while executing command  pico2wave -l en-US -w /tmp/5a9ea3bbf7dc38e1636adc1470a49843.wav 
" <volume level='15'><pitch level='60'>I am the John Bot. Pleased to meet you." && aplay /tmp/5a9ea3bbf7dc38e1636adc1470a49843.wav
*/

    // *** need to sanitize textStr and make sure it does not have a single quote
    let linuxCmd = `pico2wave -w botSpeak.wav "${textStr}" && aplay botSpeak.wav`
    //exec('dir', (err, stdout, stderr) => {
    exec(linuxCmd, (err, stdout, stderr) => {
        if (err) {
            //some err occurred
            console.error(err)
        } else {
            // the *entire* stdout and stderr (buffered)
            console.log(`stdout: ${stdout}`);
            console.log(`stderr: ${stderr}`);
        }
    })
}


// Run the server!
/*
try {
    await fastify.listen({ port: process.env.WEB_PORT, host: '0.0.0.0'  })
} catch (err) {
    fastify.log.error(err)
    process.exit(1)
}
*/


// Create Johnny-Five board object
// When running Johnny-Five programs as a sub-process (eg. init.d, or npm scripts), 
// be sure to shut the REPL off!
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

    leftEyeLed = new Led(LEFT_EYE);
    rightEyeLed = new Led(RIGHT_EYE);
    eyes = new Leds([leftEyeLed, rightEyeLed]);
    //eyes.on();
    //eyes.off();
    //eyes.strobe(150);

    /*
    new five.Proximity({
      controller: "GP2Y0A21YK",
      pin: "A8"
    });
    */
    
    // Start the function to toggle air ventilation ON and OFF
    /*
    log("Starting Air toggle interval")
    setTimeout(toggleAir, 5000)
    // Start sending metrics 10 seconds after starting (so things are calm)
    setTimeout(logMetric, 10000)
    */

    log("End of board.on (initialize) event")
})
