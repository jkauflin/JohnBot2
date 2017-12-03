var picoSpeaker = require('pico-speaker');
var dateTime = require('node-datetime');
//var dt = dateTime.create();
//var formatted = dt.format('Y-m-d H:M:S');

// Define configuration
//AUDIO_DEVICE: 'default:CARD=0',
//AUDIO_DEVICE: 'default:CARD=PCH',
/*
var picoConfig = {
  AUDIO_DEVICE: null,
  LANGUAGE: 'en-US'
};
var picoConfig = {
    AUDIO_DEVICE: null,
    LANGUAGE: 'fr-FR'
  };
  // Initialize with config
  picoSpeaker.init(picoConfig);


const player = require('rpi3-audio-player');
console.log("in testmp3");
player.play("./Hoedown.mp3");  
*/
  

function speakText(textStr){
    console.log("in speakText "+dateTime.create().format('Y-m-d H:M:S'));
    picoSpeaker.speak(textStr).then(function() {
        console.log("done speaking");
    }.bind(this));
            
}; // 

module.exports = {
    speakText
};
