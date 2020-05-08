//var picoSpeaker = require('pico-speaker');
var dateTime = require('node-datetime');
//var dt = dateTime.create();
//var formatted = dt.format('Y-m-d H:M:S');

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

// With full options
var SoundPlayer = require("sound-player");
var options = {
    //filename: "dreams.mp3",
    filename: "lookdave.wav",
    gain: 5,
    debug: true,
    player: "mpg321", // "afplay" "aplay" "mpg123" "mpg321"
//    player: "aplay", // "afplay" "aplay" "mpg123" "mpg321"
    device: "sysdefault:CARD=Device"   // sysdefault:CARD=Device   or default
}
 
// 5/20/2018 - this works
var player = new SoundPlayer(options)
// 12/2/2018 - still works
player.play();
 
//player.stop
//player.pause
//player.resume

player.on('complete', function() {
    console.log('Done with playback!');
});
 
player.on('error', function(err) {
    console.log('Error occurred:', err);
});


function speakText(textStr){
    console.log("in speakText "+dateTime.create().format('Y-m-d H:M:S')+", text = "+textStr);
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

}; // 

// picoSpeaker.shutUp() => interrupt all sentences being spoken at the moment

module.exports = {
    speakText
};
