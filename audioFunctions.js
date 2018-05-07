var picoSpeaker = require('pico-speaker');
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

console.log("in the audioFunctions");


// With full options
var SoundPlayer = require("sound-player");
var options = {
    filename: "../dreams.mp3",
    gain: 10,
    debug: true,
    player: "mpg321", // "afplay" "aplay" "mpg123" "mpg321"
    device: "default"   //
}
 
var player = new SoundPlayer(options)
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
    player.stop();
    //player.pause();
    //words = '<volume level=\'60\'><pitch level=\'133\'>' + words + '</pitch></volume>'
    picoSpeaker.speak("<volume level='15'><pitch level='60'>"+textStr).then(function() {
        //console.log("done speaking");
        //player.resume();
    }.bind(this));
}; // 

// picoSpeaker.shutUp() => interrupt all sentences being spoken at the moment

module.exports = {
    speakText
};
