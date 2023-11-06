import johnnyFivePkg from 'johnny-five'     // Library to control the Arduino board


// Constants for pin numbers and commands
const LEFT_EYE = 45;
const RIGHT_EYE = 44;

var eyes;
var leftEyeLed;
var rightEyeLed;

var eyesOn = false;


const {Board,Led,Leds,Relays,Proximity} = johnnyFivePkg


var board = null
var relays = null




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
