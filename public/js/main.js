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
 * i'm always thankful on Christmas
 *============================================================================*/
var main = (function () {
	'use strict';  // Force declaration of variables before use (among other things)
	//=================================================================================================================
	// Private variables for the Module
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
	logMessage("isTouchDevice = " + isTouchDevice);

	$.get("start", "", function (wsUrl) {
		console.log("wsUrl = " + wsUrl);
		ws = new WebSocket(wsUrl);
		// event emmited when connected
		ws.onopen = function () {
			wsConnected = true;
			//console.log('websocket is connected ...')
			$StatusDisplay.html("Connected");

			// event emmited when receiving message from the server
			ws.onmessage = function (messageEvent) {
				var serverMessage = JSON.parse(messageEvent.data);
				if (serverMessage.errorMessage != null) {
					logMessage(serverMessage.errorMessage);
				}

				// add other bot event handling here
				/*
				if (serverMessage.proxIn != null) {
					$("#proximityInches").html("Proximity inches: "+serverMessage.proxIn);
				}
				*/

				if (serverMessage.textToSpeak != null) {
					speech.speakText(serverMessage.textToSpeak);
				}

			} // on message (from server)

		} // Websocket open
	}); // start

	$SearchButton.click(_searchResponses);
	if (!isTouchDevice) {
		$SearchInput.change(_searchResponses);
	}
	$LoadDataButton.click(_loadData);

	function _searchResponses() {
		console.log("searchStr = " + $searchStr.val());
		//_wsSend('{"searchStr" : "' + $searchStr.val() + '"}');
		speech.speakText($searchStr.val());
		$searchStr.val('');
	}
	function _loadData() {
		_wsSend('{"loadData" : "Y"}');
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
				//date = new Date();
				//currMs = date.getTime();
				//if ((currMs - prevArmMs) > 500) {
				//console.log("Arm slider value = "+slideEvt.value+", date = "+date.getTime());
				_wsSend('{"armPosition" : ' + slideEvt.value + '}');
				armPos = slideEvt.value;
				//prevArmMs = currMs;
				//}
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
		_wsSend('{"voice" : 1}');
	}
	function voiceReleased() {
		_wsSend('{"voice" : 0}');
	}

	function sendSpeechText(speechText) {
		_wsSend('{"inSpeechText" : "' + speechText + '"}');
		//speech.speakText(speechText);
	}

	//=================================================================================================================
	// This is what is exposed from this Module
	return {
		sendSpeechText
	};

})(); // var main = (function(){
