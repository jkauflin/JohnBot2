/*==============================================================================
(C) Copyright 2023 John J Kauflin, All rights reserved. 
-----------------------------------------------------------------------------
DESCRIPTION: 

-----------------------------------------------------------------------------
Modification History
2023-11-06 JJK  Got Cheetah STT working from the mic demo and using the
                pv recorder to record audio from the usb mic in device 1
=============================================================================*/

//import 'dotenv/config'                      // Class to get parameters from .env file
import {log} from './util.mjs'              // My utility functions
import {exec} from 'child_process'          // Class to execute Linux commands

//import {PvRecorder} from '@picovoice/pvrecorder-node'       // Audio recorder using USB Mic
//import CheetahPkg from '@picovoice/cheetah-node'            // Speech-to-Text engine
//const {Cheetah,CheetahActivationLimitReachedError} = CheetahPkg

/*
import MPlayerPkg from 'mplayer'
const {MPlayer} = MPlayerPkg

var player = new MPlayer();
*/
/*
player.on('start', console.log.bind(this, 'playback started'));
player.on('status', console.log);
*/
/*
player.openPlaylist('http://www.miastomuzyki.pl/n/rmfclassic.pls', {
    cache: 128,
    cacheMin: 1
});
*/
/*
setTimeout(player.volume.bind(player, 50), 1000);

export function testPlay() {
    player.openFile('media/rockandroll.mp3')
    player.play()
}

export function playerStop() {
    player.stop()
}
*/

import pkg from 'sound-player';
//const {SoundPlayer} = pkg;
const {player} = pkg;


var soundPlayerOptions = {
    //filename: "dreams.mp3",
    //filename: "lookdave.wav",
    gain: 5,
    debug: true,
    player: "mpg123", // "afplay" "aplay" "mpg123" "mpg321"
//    player: "aplay", // "afplay" "aplay" "mpg123" "mpg321"
    device: "sysdefault:CARD=Device"   // sysdefault:CARD=Device   or default
}

//var player = new SoundPlayer(soundPlayerOptions)

export function testPlay() {
    soundPlayerOptions.filename = 'media/rockandroll.mp3'
    player.play(soundPlayerOptions)
}

export function playerStop() {
    player.stop
}

//player.pause
//player.resume

/*
player.on('complete', function() {
    console.log('Done with playback!')
})
player.on('error', function(err) {
    console.log('Error occurred:', err)
})
*/





export var speaking = false

/*
var picoConfig = {
  AUDIO_DEVICE: null,
  LANGUAGE: 'en-US'
  LANGUAGE: 'en-GB'
};

 en-US   English
    en-GB   Great Britain
    de-DE   German
    es-ES   Spanish
    fr-FR   French
    it-IT   Italian

  // Initialize with config
  picoSpeaker.init(picoConfig);
*/

export function speakText(textStr) {
    speaking = true
    //log("in speakText (Speaking = true), text = "+textStr)
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
    let linuxCmd = `pico2wave -l en-US -w /tmp/botSpeak.wav "<volume level='15'><pitch level='60'>${textStr}" && aplay /tmp/botSpeak.wav`
    exec(linuxCmd, (err, stdout, stderr) => {
        //log("AFTER exec - emitting doneSpeaking")
        speaking = false
        if (err) {
            //some err occurred
            console.error(err)
        } else {
            // the *entire* stdout and stderr (buffered)
            //console.log(`stdout: ${stdout}`);
            //console.log(`stderr: ${stderr}`);
        }
    })
}

