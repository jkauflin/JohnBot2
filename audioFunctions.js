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


console.log("in testmp3");
player.play("./Hoedown.mp3");  
*/
const player = require('rpi3-audio-player');

console.log("helolo john");

var blue = require("bluetoothctl");
 blue.Bluetooth()
 
 blue.on(blue.bluetoothEvents.Controller, function(controllers){
 console.log('Controllers:' + JSON.stringify(controllers,null,2))
 });
 
 blue.on(blue.bluetoothEvents.DeviceSignalLevel, function(devices,mac,signal){
     console.log('signal level of:' + mac + ' - ' + signal)
 
 });
 
 blue.on(blue.bluetoothEvents.Device, function (devices) {
     console.log('devices:' + JSON.stringify(devices,null,2))
 })
 
 blue.on(blue.bluetoothEvents.PassKey, function (passkey) {
     console.log('Confirm passkey:' + passkey)
     blue.confirmPassKey(true);
 })
 
 var hasBluetooth=blue.checkBluetoothController();
 console.log('system has bluetooth controller:' + hasBluetooth)
 
 if(hasBluetooth) {
    blue.connect("32:69:4D:B9:A6:9F");

    /*
     console.log('isBluetooth Ready:' + blue.isBluetoothReady)
     blue.scan(true)
     setTimeout(function(){
         console.log('stopping scan')
         blue.scan(false)
         blue.info('00:0C:8A:8C:D3:71')
     },20000)
     */
     //speakText("Hello, John, how are you?");

     console.log("playing MP3 file");
    player.play("./hoedown.mp3");  

 }


 
function speakText(textStr){
    console.log("in speakText "+dateTime.create().format('Y-m-d H:M:S'));
    picoSpeaker.speak(textStr).then(function() {
        console.log("done speaking");
    }.bind(this));
            
}; // 

module.exports = {
    speakText
};
