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
                *** Giving up on web servers - trying to get working on device
2023-11-05 JJK  Working on audio capture from a USB microphone, and then
                using picovoice for STT
2023-11-06 JJK  Got Cheetah STT working from the mic demo and using the
                pv recorder to record audio from the usb mic in device 1.
                Implementing RiveScript brain for replies and bot commands
=============================================================================*/

import 'dotenv/config'                            // Class to get parameters from .env file
import {log} from './util.mjs'                    // My utility functions
import {speakText,speaking} from './audioFunctions.mjs'    // My audio (TTS) functions
import {getChatBotReply} from './chatBot.mjs'    // My audio (TTS) functions
//import fs, { readFileSync } from 'node:fs'
//import path from 'node:path'
//import { syncBuiltinESMExports } from 'node:module'
//import { Buffer } from 'node:buffer'

import readline from 'node:readline'
//import {checkWaveFile,getInt16Frames} from './wave_util.mjs'
import {PvRecorder} from '@picovoice/pvrecorder-node'
//import {Porcupine,BuiltinKeyword} from '@picovoice/porcupine-node'
import CheetahPkg from '@picovoice/cheetah-node'
const {Cheetah,CheetahActivationLimitReachedError} = CheetahPkg

// General handler for any uncaught exceptions
process.on('uncaughtException', function (e) {
    log("UncaughtException, error = " + e);
    console.error(e.stack);
    // Stop the process
    // 2017-12-29 JJK - Don't stop for now, just log the error
    //process.exit(1);
});

log(">>> Starting JohnBot...")

/*
var speaking = false
speakTextEmitter.on('doneSpeaking', () => {
    log("in Server, doneSpeaking set to false")
    speaking = false
})
*/

var speechText = ""

async function startListening() {
    const accessKey = process.env.PICOVOICE_ACCESS_KEY
    const audioDeviceIndex = 1
    const frameLength = 512
    const endpointDurationSec = 1
    let isInterrupted = false

    /*
    if (showAudioDevicesDefined) {
        const devices = PvRecorder.getAvailableDevices();
        for (let i = 0; i < devices.length; i++) {
        console.log(`index: ${i}, device name: ${devices[i]}`);
      }
      process.exit();
    }
    */
  
    if (accessKey === undefined) {
      console.log("No AccessKey provided");
      process.exit();
    }
  
    let engineInstance = new Cheetah(accessKey,
        {
          endpointDurationSec: endpointDurationSec,
          enableAutomaticPunctuation: true
        })

    const recorder = new PvRecorder(frameLength, audioDeviceIndex)
    recorder.start()
    //console.log(`Using device: ${recorder.getSelectedDevice()}`);
    console.log("Listening... Press `ENTER` to stop:")
    readline.emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdin.on("keypress", (key, str) => {
        if (str.sequence === '\r' || str.sequence === '\n') {
            isInterrupted = true
        }
    })
    /*
    process.on('SIGTERM', function () {
        log('on SIGTERM')
        recorder.stop()
        recorder.release()
        engineInstance.release()
    })
    */

    while (!isInterrupted) {
        const pcm = await recorder.read()
        // Stop translating speech audio when actively speaking (because it translates that)
        if (!speaking) {
            try {
                const [partialTranscript, isEndpoint] = engineInstance.process(pcm)
                //console.log("partial = "+partialTranscript)
                //process.stdout.write(partialTranscript)
                speechText += partialTranscript
                if (isEndpoint === true) {
                    const finalTranscript = engineInstance.flush()
                    //process.stdout.write(`${finalTranscript}\n`);
                    speechText += finalTranscript
                    log(`speechText = ${speechText}`)
                    getChatBotReply(speechText)
                    .then(reply => {
                        //log("after call, reply = "+reply)
                        speakText(reply)
                    })
                    speechText = ""
                }
            } catch (err) {
                /*
                if (err instanceof CheetahActivationLimitReachedError) {
                    console.error(`AccessKey '${accessKey}' has reached it's processing limit.`)
                } else {
                    console.error(err)
                }
                */
                console.error(err)
                isInterrupted = true;
            }
        }
    }
    
    recorder.stop()
    recorder.release()
    engineInstance.release()
    process.exit()
}

startListening()

/*
setTimeout(testReply,5000)

function testReply() {
    getChatBotReply("hello johnbot")
    .then(reply => {
        log("after call, reply = "+reply)
    })
}
*/