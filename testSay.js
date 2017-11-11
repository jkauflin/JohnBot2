/*
var say = require('say');

//say.setPlatform(say.platforms.WIN32);

console.log("before speak");
// Use default system voice and speed
say.speak('whats up, dog?', 'Alex');
say.speak('Hello! My name is John.');

// Stop the text currently being spoken
say.stop();
*/
var say = require('say');

say.speak('Hello, how are you today?', (err) => {
    if (err) {
        return console.error(err);
    }

    console.log('Text has been spoken.');
});

if ('speechSynthesis' in window) {
    // Synthesis support. Make your web apps talk!
    console.log("speechSynthesis");
}
   
   if ('SpeechRecognition' in window) {
     // Speech recognition support. Talk to your apps!
     console.log("SpeechRecognition");
   }