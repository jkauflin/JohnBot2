/*==============================================================================
 * (C) Copyright 2017 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: Client-side JS functions and logic for JohnBot2
 *----------------------------------------------------------------------------
 * Modification History
 * 2017-09-08 JJK Initial version 
 * 2017-12-29 JJK	Initial controls and WebSocket communication
 * 2017-01-21 JJK	Implementing response to buttons for manual controls
 *============================================================================*/

// Global variables
var ws = null;
var wsConnected = false;
var isTouchDevice = false;
var date;

var headPos = 0;
var armPos = 0;
var motorPos = 0;

var currMs = 0;
var prevArmMs = 0;

//Non-Printable characters - Hex 01 to 1F, and 7F
var nonPrintableCharsStr = "[\x01-\x1F\x7F]";
//"g" global so it does more than 1 substitution
var regexNonPrintableChars = new RegExp(nonPrintableCharsStr,"g");

function cleanStr(inStr) {
	return inStr.replace(regexNonPrintableChars,'');
}
function setCheckbox(checkVal){
	var checkedStr = '';
	if (checkVal == 1) {
		checkedStr = 'checked=true';
	}
	return '<input type="checkbox" data-mini="true" '+checkedStr+' disabled="disabled">';
}
$(document).ajaxError(function(e, xhr, settings, exception) {
	console.log("ajax exception = "+exception);
	console.log("ajax exception xhr.responseText = "+xhr.responseText);
	$(".ajaxError").html("An Error has occurred (see console log)");
	$("#StatusDisplay").html("An Error has occurred (see console log)");
});

function logMessage(message) {
	console.log(message);
	$("#logMessage").html(message);
}

$(document).ready(function(){
	isTouchDevice = 'ontouchstart' in document.documentElement;
	logMessage("isTouchDevice = "+isTouchDevice);

	// Auto-close the collapse menu after clicking a non-dropdown menu item (in the bootstrap nav header)
	$(document).on('click','.navbar-collapse.in',function(e) {
		if( $(e.target).is('a') && $(e.target).attr('class') != 'dropdown-toggle' ) {
				$(this).collapse('hide');
		}
	});

	// Using addClear plug-in function to add a clear button on input text fields
	$(".resetval").addClear();

	$.getJSON("start","",function(response){
		//console.log("response.wsUrl = "+response.wsUrl);
		ws = new WebSocket(response.wsUrl);
		// event emmited when connected
		ws.onopen = function () {
				wsConnected = true;
				//console.log('websocket is connected ...')
				// sending a send event to websocket server
				//ws.send('This is the message being sent from the client browser')
				$("#StatusDisplay").html("Connected");

				// event emmited when receiving message from the server
				ws.onmessage = function (messageEvent) {
					var serverMessage = JSON.parse(messageEvent.data);
					if (serverMessage.errorMessage != null) {
						logMessage(serverMessage.errorMessage);
					}

					// add other bot event handling here
					if (serverMessage.proxIn != null) {
						$("#proximityInches").html("Proximity inches: "+serverMessage.proxIn);
					}
				} // on message (from server)

		} // Websocket open
	}); // start

	// Respond to the Search button click (because I can't figure out how to combine it with input change)
	$(document).on("click","#SearchButton",function(){
        //$("#PropertyListDisplay tbody").html("");
		console.log("searchStr = "+$("#searchStr").val());
    	//$.getJSON("testcall","searchStr="+cleanStr($("#searchStr").val()),function(response){
		/*
		$.get("testcall","searchStr="+cleanStr($("#searchStr").val()),function(response){
				console.log("response from SERVER in client = "+response);
    		//displayPropertyList(hoaPropertyRecList);
		});
		*/
		//ws.send($("#searchStr").val());
    event.stopPropagation();
	});
	
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
	$("#ForwardButton")
		.mousedown(function() {
			if (!isTouchDevice) { forwardPushed(); }
		})
		.mouseup(function() {
			if (!isTouchDevice) { forwardReleased(); }
		})
		.on('touchstart', function(){
			if (isTouchDevice) { forwardPushed(); }
		})
		.on('touchend', function(){
			if (isTouchDevice)  { forwardReleased(); }
		});

	$("#BackwardButton")
		.mousedown(function() {
			if (!isTouchDevice) { backwardPushed(); }
		})
		.mouseup(function() {
			if (!isTouchDevice) { backwardReleased(); }
		})
		.on('touchstart', function(){
			if (isTouchDevice) { backwardPushed(); }
		})
		.on('touchend', function(){
			if (isTouchDevice)  { backwardReleased(); }
		});

	$("#RotateLeftButton")
		.mousedown(function() {
			if (!isTouchDevice) { rotateLeftPushed(); }
		})
		.mouseup(function() {
			if (!isTouchDevice) { rotateLeftReleased(); }
		})
		.on('touchstart', function(){
			if (isTouchDevice) { rotateLeftPushed(); }
		})
		.on('touchend', function(){
			if (isTouchDevice)  { rotateLeftReleased(); }
		});

	$("#RotateRightButton")
		.mousedown(function() {
			if (!isTouchDevice) { rotateRightPushed(); }
		})
		.mouseup(function() {
			if (!isTouchDevice) { rotateRightReleased(); }
		})
		.on('touchstart', function(){
			if (isTouchDevice) { rotateRightPushed(); }
		})
		.on('touchend', function(){
			if (isTouchDevice)  { rotateRightReleased(); }
		});

	$("#EyeButton")
		.mousedown(function() {
			if (!isTouchDevice) { eyePushed(); }
		})
		.mouseup(function() {
			if (!isTouchDevice) { eyeReleased(); }
		})
		.on('touchstart', function(){
			if (isTouchDevice) { eyePushed(); }
		})
		.on('touchend', function(){
			if (isTouchDevice)  { eyeReleased(); }
		});

	$("#VoiceButton")
		.mousedown(function() {
			if (!isTouchDevice) { voicePushed(); }
		})
		.mouseup(function() {
			if (!isTouchDevice) { voiceReleased(); }
		})
		.on('touchstart', function(){
			if (isTouchDevice) { voicePushed(); }
		})
		.on('touchend', function(){
			if (isTouchDevice)  { voiceReleased(); }
		});
		
	$("#MotorSpeed").slider({
		reversed : true
	})
	.on("slide", function(slideEvt) {
		//$("#ex6SliderVal").text(slideEvt.value);
		//console.log("slider value = "+slideEvt.value);
		if (slideEvt.value != motorPos) {
			wsSend('{"motorSpeed" : '+slideEvt.value+'}');
			motorPos = slideEvt.value;
		}
	})
	.on("slideStop", function(slideEvt) {
		//$("#ex6SliderVal").text(slideEvt.value);
		//console.log("slider value = "+slideEvt.value);
		wsSend('{"motorSpeed" : '+slideEvt.value+'}');
	});

	$("#ArmPosition").slider({
		reversed : true
	})
	.on("slide", function(slideEvt) {
		//$("#ex6SliderVal").text(slideEvt.value);
		//console.log("slider value = "+slideEvt.value);
		if (slideEvt.value != armPos) {
			//date = new Date();
			//currMs = date.getTime();
			//if ((currMs - prevArmMs) > 500) {
				//console.log("Arm slider value = "+slideEvt.value+", date = "+date.getTime());
				wsSend('{"armPosition" : '+slideEvt.value+'}');
				armPos = slideEvt.value;
				//prevArmMs = currMs;
			//}
		}
	})
	.on("slideStop", function(slideEvt) {
		//$("#ex6SliderVal").text(slideEvt.value);
		//console.log("slider value = "+slideEvt.value);
		wsSend('{"armPosition" : '+slideEvt.value+'}');
	});

	$("#HeadPosition").slider({
	})
	.on("slide", function(slideEvt) {
		if (slideEvt.value != headPos) {
			//console.log("Head slider value = "+slideEvt.value);
			wsSend('{"headPosition" : '+slideEvt.value+'}');
			headPos = slideEvt.value;
		}
	})
	.on("slideStop", function(slideEvt) {
		//console.log("sliderStop value = "+slideEvt.value);
		wsSend('{"headPosition" : '+slideEvt.value+'}');
	});


}); // $(document).ready(function(){

// General function to send the botMessage to the server if Websocket is connected
function wsSend(botMessage) {
	if (wsConnected) {
		ws.send(botMessage);
	}
}
	
function forwardPushed() {
	//console.log("EYES - Pushed");
	//$("#logMessage").html("EYES - Pushed");
	wsSend('{"moveDirection" : "F","move" : 1}');
}
function forwardReleased() {
	//console.log("EYES - Released");
	//$("#logMessage").html("EYES - Released");
	wsSend('{"move" : 0}');
}

function backwardPushed() {
	//console.log("EYES - Pushed");
	//$("#logMessage").html("EYES - Pushed");
	wsSend('{"moveDirection" : "R","move" : 1}');
}
function backwardReleased() {
	//console.log("EYES - Released");
	//$("#logMessage").html("EYES - Released");
	wsSend('{"move" : 0}');
}

function rotateLeftPushed() {
	wsSend('{"rotateDirection" : "L","rotate" : 1}');
}
function rotateLeftReleased() {
	wsSend('{"rotate" : 0}');
}

function rotateRightPushed() {
	wsSend('{"rotateDirection" : "R","rotate" : 1}');
}
function rotateRightReleased() {
	wsSend('{"rotate" : 0}');
}

function eyePushed() {
	wsSend('{"eyes" : 1}');
}
function eyeReleased() {
	wsSend('{"eyes" : 0}');
}

function voicePushed() {
	wsSend('{"voice" : 1}');
}
function voiceReleased() {
	wsSend('{"voice" : 0}');
}


	var create_email = false;
	var final_transcript = '';
	var recognizing = false;
	var ignore_onend;
	var start_timestamp;
	if (!('webkitSpeechRecognition' in window)) {
	  upgrade();
	} else {
	  start_button.style.display = 'inline-block';
	  var recognition = new webkitSpeechRecognition();
	  recognition.continuous = true;
	  recognition.interimResults = true;
	
	  recognition.onstart = function() {
			recognizing = true;
			showInfo('info_speak_now');
			start_img.src = './img/mic-animate.gif';
	  };
	
	  recognition.onerror = function(event) {
			console.log("recognition error = "+event.error);
			/*
			if (event.error == 'no-speech') {
				start_img.src = './img/mic.gif';
				showInfo('info_no_speech');
				ignore_onend = true;
			}
			if (event.error == 'audio-capture') {
				start_img.src = './img/mic.gif';
				showInfo('info_no_microphone');
				ignore_onend = true;
			}
			if (event.error == 'not-allowed') {
				if (event.timeStamp - start_timestamp < 100) {
				showInfo('info_blocked');
				} else {
				showInfo('info_denied');
				}
				ignore_onend = true;
			}
			*/
	  };
	
	  recognition.onend = function() {
			recognizing = false;
			if (ignore_onend) {
				return;
			}
			start_img.src = './img/mic.gif';
			if (!final_transcript) {
				showInfo('info_start');
				return;
			}
			showInfo('');
			if (window.getSelection) {
				window.getSelection().removeAllRanges();
				var range = document.createRange();
				range.selectNode(document.getElementById('final_span'));
				window.getSelection().addRange(range);
			}
			/*
			if (create_email) {
				create_email = false;
				createEmail();
			}
			*/
	  };
	
	  recognition.onresult = function(event) {
			var interim_transcript = '';
			for (var i = event.resultIndex; i < event.results.length; ++i) {
				if (event.results[i].isFinal) {
				final_transcript += event.results[i][0].transcript;
				} else {
				interim_transcript += event.results[i][0].transcript;
				}
			}
			final_transcript = capitalize(final_transcript);
			final_span.innerHTML = linebreak(final_transcript);
			interim_span.innerHTML = linebreak(interim_transcript);
			if (final_transcript || interim_transcript) {
				showButtons('inline-block');
			}
		};
	}
	
	function upgrade() {
	  start_button.style.visibility = 'hidden';
	  showInfo('info_upgrade');
	}
	
	var two_line = /\n\n/g;
	var one_line = /\n/g;
	function linebreak(s) {
	  return s.replace(two_line, '<p></p>').replace(one_line, '<br>');
	}
	
	var first_char = /\S/;
	function capitalize(s) {
	  return s.replace(first_char, function(m) { return m.toUpperCase(); });
	}
	
	function copyButton() {
	  if (recognizing) {
			recognizing = false;
			recognition.stop();
	  }
	  copy_button.style.display = 'none';
	  copy_info.style.display = 'inline-block';
	  showInfo('');
	}
	
	/*
	function createEmail() {
	  var n = final_transcript.indexOf('\n');
	  if (n < 0 || n >= 80) {
		n = 40 + final_transcript.substring(40).indexOf(' ');
	  }
	  var subject = encodeURI(final_transcript.substring(0, n));
	  var body = encodeURI(final_transcript.substring(n + 1));
	  window.location.href = 'mailto:?subject=' + subject + '&body=' + body;
	}

	function emailButton() {
	  if (recognizing) {
		create_email = true;
		recognizing = false;
		recognition.stop();
	  } else {
		createEmail();
	  }
	  email_button.style.display = 'none';
	  email_info.style.display = 'inline-block';
	  showInfo('');
	}
	*/

	function startButton(event) {
		console.log("mic start");
	  if (recognizing) {
			recognition.stop();
			return;
	  }
	  final_transcript = '';
	  //recognition.lang = select_dialect.value;
	  //recognition.lang = 'en-US';
	  recognition.start();
	  ignore_onend = false;
	  final_span.innerHTML = '';
	  interim_span.innerHTML = '';
	  start_img.src = './img/mic-slash.gif';
	  showInfo('info_allow');
	  showButtons('none');
	  start_timestamp = event.timeStamp;
	}
	
	function showInfo(s) {
		console.log("showInfo = "+s);
		/*
	  if (s) {
		for (var child = info.firstChild; child; child = child.nextSibling) {
		  if (child.style) {
			child.style.display = child.id == s ? 'inline' : 'none';
		  }
		}
		info.style.visibility = 'visible';
	  } else {
		info.style.visibility = 'hidden';
		}
		*/
	}
	
	var current_style;
	function showButtons(style) {
	  if (style == current_style) {
		return;
	  }
	  current_style = style;
	  copy_button.style.display = style;
	  //email_button.style.display = style;
	  copy_info.style.display = 'none';
	  //email_info.style.display = 'none';
	}
	
	