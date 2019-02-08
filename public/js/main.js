/*==============================================================================
 * (C) Copyright 2017,2018 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: Client-side JS functions and logic for JohnBot2
 *----------------------------------------------------------------------------
 * Modification History
 * 2017-09-08 JJK Initial version 
 * 2017-12-29 JJK	Initial controls and WebSocket communication
 * 2017-01-21 JJK	Implementing response to buttons for manual controls
 * 2018-12-07 JJK	Re-factor to use modules
 * 2018-12-25 JJK	I'm always thankful on Christmas
 * 2019-01-19 JJK	Change back to search using web site database and new
 * 					fuzzy match algorithm
 * 2019-02-01 JJK	Implement command check on spoken text
 * 					Working on activity loop
 *============================================================================*/
var main = (function () {
	'use strict';  // Force declaration of variables before use (among other things)
	//=================================================================================================================
	// Private variables for the Module
	var env;
	var ws = null;
	var wsConnected = false;
	var isTouchDevice = false;
	var date;

	var headPos = 0;
	var armPos = 0;
	var motorPos = 0;

	var currMs = 0;
	var prevArmMs = 0;

	//=================================================================================================================
	// Variables cached from the DOM
	var $document = $(document);
	var $logMessage = $document.find("#logMessage");
	var $StatusDisplay = $document.find("#StatusDisplay");

	var $SearchButton = $document.find("#SearchButton");
	var $SearchInput = $document.find("#SearchInput");
	var $searchStr = $document.find("#searchStr");
	var $LoadDataButton = $document.find("#LoadDataButton");

	var $ForwardButton = $document.find("#ForwardButton");
	var $BackwardButton  = $document.find("#BackwardButton");
	var $RotateLeftButton = $document.find("#RotateLeftButton");
	var $RotateRightButton = $document.find("#RotateRightButton");
	var $EyeButton = $document.find("#EyeButton");
	var $VoiceButton = $document.find("#VoiceButton");
	var $MotorSpeed = $document.find("#MotorSpeed");
	var $ArmPosition = $document.find("#ArmPosition");
	var $HeadPosition = $document.find("#HeadPosition");

	//=================================================================================================================
	// Bind events
	isTouchDevice = 'ontouchstart' in document.documentElement;
	//logMessage("isTouchDevice = " + isTouchDevice);

	// track when start button is hit - say hello
	//$SpeechToTextButton.click(_ToggleSpeechToText);

	// Call the start service on the server to get environment parameters and establish a websocket connection
	/*
	var jqxhr = $.get("getWsUrl", "", connectToBot).fail(function () {
		console.log("error getting wsUrl");
	});
	*/

	function connectToBot(wsUrl) {
	    console.log("in connectToBot, wsUrl = " + wsUrl);

	    ws = new WebSocket(wsUrl);
	    // event emmited when connected
	    ws.onopen = function () {
	        wsConnected = true;
	        //console.log('websocket is connected ...')
	        $StatusDisplay.html("Connected");

	        // event emmited when receiving message from the server (messages from the robot)
	        ws.onmessage = function (messageEvent) {
	            var serverMessage = JSON.parse(messageEvent.data);
	            if (serverMessage.errorMessage != null) {
	                logMessage(serverMessage.errorMessage);
	            }

	            // add other bot event handling here
	            if (serverMessage.proxIn != null) {
	                $("#proximityInches").html("Proximity inches: " + serverMessage.proxIn);
	            }

	            // Text that the robot want spoken
	            // (*** No, just have the robot report events, and let the
	            //  main client controller decide what to say ***)
	            /*
	            if (serverMessage.textToSpeak != null) {
	            	sayAndAnimate(serverMessage.textToSpeak);
	            }
	            */
	        } // on message (from server)

	    } // Websocket open
	}

	// Get environment variables from a local service
	var jqxhr = $.getJSON("dotenv.php", "", function (inEnv) {
		env = inEnv;
		//console.log("botEnv, BOT_WEB_URL = " + env.BOT_WEB_URL);
		//console.log("botEnv, UID = " + env.UID);

		getJokes();

		connectToBot(env.wsUrl);

	}).fail(function () {
		console.log("Error getting environment variables");
	});

	// doing this twice
	if (!isTouchDevice) {
		$SearchInput.change(_searchResponses);
	} else {
		$SearchButton.click(_searchResponses);
	}
	//$LoadDataButton.click(_loadData);

	function _searchResponses() {
		console.log("searchStr = " + $searchStr.val());
		//_wsSend('{"searchStr" : "' + $searchStr.val() + '"}');

		var speechText = $searchStr.val();

		if (speechText.toLowerCase().search("stop") >= 0) {
		    _wsSend('{"stop":1}');
		} else if (speechText.toLowerCase().search("turn") >= 0) {
		    // rotate - direction, [duration], [degrees], [speed]
		    // get duration or degrees parameter from next work
		    _wsSend('{"rotate":1,"rotateDirection":"R","rotateDuration":2500}');
		}

		handleTextFromSpeech($searchStr.val());
		$searchStr.val('');
	}

	/*
var botMessage = {
"moveDirection" : "F",
"move" : 1,
"rotateDirection" : "R",
"rotate" : 0,
"eyes" : 0,
"motorSpeed" : 100,
"armPosition" : 90,
"headPosition" : 90
};
	*/
	$ForwardButton
		.mousedown(function () {
			if (!isTouchDevice) { forwardPushed(); }
		})
		.mouseup(function () {
			if (!isTouchDevice) { forwardReleased(); }
		})
		.on('touchstart', function () {
			if (isTouchDevice) { forwardPushed(); }
		})
		.on('touchend', function () {
			if (isTouchDevice) { forwardReleased(); }
		});

	$BackwardButton
		.mousedown(function () {
			if (!isTouchDevice) { backwardPushed(); }
		})
		.mouseup(function () {
			if (!isTouchDevice) { backwardReleased(); }
		})
		.on('touchstart', function () {
			if (isTouchDevice) { backwardPushed(); }
		})
		.on('touchend', function () {
			if (isTouchDevice) { backwardReleased(); }
		});

	$RotateLeftButton
		.mousedown(function () {
			if (!isTouchDevice) { rotateLeftPushed(); }
		})
		.mouseup(function () {
			if (!isTouchDevice) { rotateLeftReleased(); }
		})
		.on('touchstart', function () {
			if (isTouchDevice) { rotateLeftPushed(); }
		})
		.on('touchend', function () {
			if (isTouchDevice) { rotateLeftReleased(); }
		});

	$RotateRightButton
		.mousedown(function () {
			if (!isTouchDevice) { rotateRightPushed(); }
		})
		.mouseup(function () {
			if (!isTouchDevice) { rotateRightReleased(); }
		})
		.on('touchstart', function () {
			if (isTouchDevice) { rotateRightPushed(); }
		})
		.on('touchend', function () {
			if (isTouchDevice) { rotateRightReleased(); }
		});

	$EyeButton
		.mousedown(function () {
			if (!isTouchDevice) { eyePushed(); }
		})
		.mouseup(function () {
			if (!isTouchDevice) { eyeReleased(); }
		})
		.on('touchstart', function () {
			if (isTouchDevice) { eyePushed(); }
		})
		.on('touchend', function () {
			if (isTouchDevice) { eyeReleased(); }
		});

	$VoiceButton
		.mousedown(function () {
			if (!isTouchDevice) { voicePushed(); }
		})
		.mouseup(function () {
			if (!isTouchDevice) { voiceReleased(); }
		})
		.on('touchstart', function () {
			if (isTouchDevice) { voicePushed(); }
		})
		.on('touchend', function () {
			if (isTouchDevice) { voiceReleased(); }
		});

	$MotorSpeed.slider({
		reversed: true
	})
		.on("slide", function (slideEvt) {
			//$("#ex6SliderVal").text(slideEvt.value);
			//console.log("slider value = "+slideEvt.value);
			if (slideEvt.value != motorPos) {
				_wsSend('{"motorSpeed" : ' + slideEvt.value + '}');
				motorPos = slideEvt.value;
			}
		})
		.on("slideStop", function (slideEvt) {
			//$("#ex6SliderVal").text(slideEvt.value);
			//console.log("slider value = "+slideEvt.value);
			_wsSend('{"motorSpeed" : ' + slideEvt.value + '}');
		});

	$ArmPosition.slider({
		reversed: true
	})
		.on("slide", function (slideEvt) {
			//$("#ex6SliderVal").text(slideEvt.value);
			//console.log("slider value = "+slideEvt.value);
			if (slideEvt.value != armPos) {
				_wsSend('{"armPosition" : ' + slideEvt.value + '}');
				armPos = slideEvt.value;
			}
		})
		.on("slideStop", function (slideEvt) {
			//$("#ex6SliderVal").text(slideEvt.value);
			//console.log("slider value = "+slideEvt.value);
			_wsSend('{"armPosition" : ' + slideEvt.value + '}');
		});

	$HeadPosition.slider({
	})
		.on("slide", function (slideEvt) {
			if (slideEvt.value != headPos) {
				//console.log("Head slider value = "+slideEvt.value);
				_wsSend('{"headPosition" : ' + slideEvt.value + '}');
				headPos = slideEvt.value;
			}
		})
		.on("slideStop", function (slideEvt) {
			//console.log("sliderStop value = "+slideEvt.value);
			_wsSend('{"headPosition" : ' + slideEvt.value + '}');
		});


	//=================================================================================================================
	// Module methods
	function logMessage(message) {
		console.log(message);
		$logMessage.html(message);
	}

	// General function to send the botMessageStr to the server if Websocket is connected
	function _wsSend(botMessageStr) {
		//console.log("in _wsSend, wsConnected = "+wsConnected);
		if (wsConnected) {
			//console.log("in _wsSend, botMessageStr = "+botMessageStr);
			ws.send(botMessageStr);
		}
	}

	function forwardPushed() {
		//console.log("EYES - Pushed");
		//$("#logMessage").html("EYES - Pushed");
		_wsSend('{"moveDirection" : "F","move" : 1}');
	}
	function forwardReleased() {
		//console.log("EYES - Released");
		//$("#logMessage").html("EYES - Released");
		_wsSend('{"move" : 0}');
	}

	function backwardPushed() {
		//console.log("EYES - Pushed");
		//$("#logMessage").html("EYES - Pushed");
		_wsSend('{"moveDirection" : "R","move" : 1}');
	}
	function backwardReleased() {
		//console.log("EYES - Released");
		//$("#logMessage").html("EYES - Released");
		_wsSend('{"move" : 0}');
	}

	function rotateLeftPushed() {
		_wsSend('{"rotateDirection" : "L","rotate" : 1}');
	}
	function rotateLeftReleased() {
		_wsSend('{"rotate" : 0}');
	}

	function rotateRightPushed() {
		_wsSend('{"rotateDirection" : "R","rotate" : 1}');
	}
	function rotateRightReleased() {
		_wsSend('{"rotate" : 0}');
	}

	function eyePushed() {
		_wsSend('{"eyes" : 1}');
	}
	function eyeReleased() {
		_wsSend('{"eyes" : 0}');
	}

	function voicePushed() {
		sayAndAnimate("I am the John bought.  You cannot kill me");
	}
	function voiceReleased() {
		//_wsSend('{"voice" : 0}');
	}

	// Respond to string recognized by speech to text (or from search input text box)
	function handleTextFromSpeech(speechText) {
		console.log(" in handleTextFromSpeech, speechText = " + speechText);

		// Send the speechText to the robot to see if there is a matching command to take action on
		//_wsSend('{"speechText" : "' + speechText + '"}');

		// Send the speech text to a search service to get a response
		$.getJSON(env.BOT_WEB_URL+"getBotResponsesProxy.php", "searchStr=" + util.replaceQuotes(speechText) + "&UID=" + env.UID, function (response) {
			//console.log("response.length = " + response.length);
			console.log("response = "+JSON.stringify(response));

			// 2019-01-25 Remove the default - if you don't find a response, don't say anything
			//var textToSpeak = "I am not programmed to respond in this area.";
		    if (response.length > 0) {
				if (response[0].score > 1) {
					sayAndAnimate(response[0].verbalResponse);
				}
		    }

			// on repeats, maybe try to use another response in the array (to change it up and make it variable - don't take the top one always)
			/*
		    for (var current in jsonResponse) {
		        if (current == 0) {
		            textToSpeak = jsonResponse[current].verbalResponse;
		        }
		        // how do I know when the update is done - do I care?
		        // log how many records were in the service call JSON response
		        //console.log("id = "+botResponsesList[current].id);
		        console.log(dateTime.create().format('H:M:S.N') + ", response(" + current + ") = " + JSON.stringify(jsonResponse[current]));
		    } // loop through JSON list
			*/

		}).catch(function (error) {
			console.log("Error in getBotResponses getJSON, err = " + error);
		});
	}

	// Respond to string recognized by speech to text (or from search input text box)
	function getJokes() {
		console.log(" in getJokes ");

		// Send the speech text to a search service to get a response
		$.getJSON(env.BOT_WEB_URL + "getBotDataProxy.php", "table=jokes" + "&UID=" + env.UID, function (response) {
			//console.log("response.length = " + response.length);
			console.log("response = " + JSON.stringify(response));

			// 2019-01-25 Remove the default - if you don't find a response, don't say anything
			//var textToSpeak = "I am not programmed to respond in this area.";
			if (response.length > 0) {
				/*
				if (response[0].score > 1) {
					sayAndAnimate(response[0].verbalResponse);
				}
				*/
			}

			// on repeats, maybe try to use another response in the array (to change it up and make it variable - don't take the top one always)
			/*
		    for (var current in jsonResponse) {
		        if (current == 0) {
		            textToSpeak = jsonResponse[current].verbalResponse;
		        }
		        // how do I know when the update is done - do I care?
		        // log how many records were in the service call JSON response
		        //console.log("id = "+botResponsesList[current].id);
		        console.log(dateTime.create().format('H:M:S.N') + ", response(" + current + ") = " + JSON.stringify(jsonResponse[current]));
		    } // loop through JSON list
			*/

		}).catch(function (error) {
			console.log("Error in getBotData getJSON, err = " + error);
		});
	}

	// Respond to string recognized by speech to text
	function handleDoneSpeaking(speechText) {
		//console.log(dateTime.create().format('H:M:S.N') + ", in handleTextFromSpeech, speechText = " + speechText);
		//console.log(", in handleTextFromSpeech, speechText = " + speechText);
		//_wsSend('{"doneSpeaking" : 1}');
	}

	function sayAndAnimate(textToSpeak) {
		// Ask the speech module to say the response text
		$("#VerbalRepsonse").html(textToSpeak);
		speech.speakText(textToSpeak);
		// Send text to robot to animate speech (if connected)
		_wsSend('{"textToSpeak" : "' + textToSpeak + '"}');
	}

	// Main activity loop
	var loopStart = true;
	const activityLoop = setInterval(function () {
  		//console.log("In the activityLoop, now = "+Date.now());
		if (loopStart) {
			//sayAndAnimate("Hello, I am the John bought.");
			loopStart = false;
		}

  		// put stuff for the state loop in here

	}, 1000);

	//=================================================================================================================
	// This is what is exposed from this Module
	return {
		handleTextFromSpeech,
		handleDoneSpeaking
	};

})(); // var main = (function(){
