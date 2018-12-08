/*==============================================================================
 * (C) Copyright 2018 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: Client-side JS functions and logic for Speech-to-Text (STT)
 *              and Text-to-Speech (TTS)
 *----------------------------------------------------------------------------
 * Modification History
 * 2018-12-07 JJK   Initial version (from some web example) 
 * 2018-12-08 JJK   Got working with a tight couple to call a main function
 *                  when a final transcript was recognized
 *============================================================================*/
var speech = (function () {
    'use strict';  // Force declaration of variables before use (among other things)
    //=================================================================================================================
    // Private variables for the Module
    const two_line = /\n\n/g;
    const one_line = /\n/g;
    const first_char = /\S/;
    var final_transcript = '';
    var recognizing = false;
    var ignore_onend;
    var start_timestamp;

    //=================================================================================================================
    // Variables cached from the DOM
    var $document = $(document);
    var $SpeechToTextButton = $document.find("#SpeechToTextButton");

    //=================================================================================================================
    // Bind events
    $SpeechToTextButton.click(_ToggleSpeechToText);
    
    if (!('webkitSpeechRecognition' in window)) {
        console.log("webkitSpeechRecognition not supported");
    } else {
        //start_button.style.display = 'inline-block';
        var recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onstart = function () {
            recognizing = true;
            //showInfo('info_speak_now');
            STTButtonImage.src = './img/mic-animate.gif';
        };

        recognition.onerror = function (event) {
            if (event.error == 'no-speech') {
                STTButtonImage.src = './img/mic.gif';
                //showInfo('info_no_speech');
                ignore_onend = true;
            }
            if (event.error == 'audio-capture') {
                STTButtonImage.src = './img/mic.gif';
                //showInfo('info_no_microphone');
                ignore_onend = true;
            }
            if (event.error == 'not-allowed') {
                if (event.timeStamp - start_timestamp < 100) {
                    //showInfo('info_blocked');
                } else {
                    //showInfo('info_denied');
                }
                ignore_onend = true;
            }
        };

        recognition.onend = function () {
            recognizing = false;
            if (ignore_onend) {
                return;
            }
            STTButtonImage.src = './img/mic.gif';
            if (!final_transcript) {
                //showInfo('info_start');
                return;
            }
            //showInfo('');
            if (window.getSelection) {
                window.getSelection().removeAllRanges();
                var range = document.createRange();
                range.selectNode(document.getElementById('STTResultsSpan'));
                window.getSelection().addRange(range);
            }
        };

        recognition.onresult = function (event) {
            var interim_transcript = '';
            for (var i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final_transcript += event.results[i][0].transcript;
                } else {
                    interim_transcript += event.results[i][0].transcript;
                }
            }
            final_transcript = capitalize(final_transcript);
            STTResultsSpan.innerHTML = linebreak(final_transcript);
            if (final_transcript || interim_transcript) {
                if (final_transcript) {
                    //console.log(">>> final_transcript = " + final_transcript);
                    
                    // *** tightly coupled to a function in main right now, but could implement
                    // *** a publish/subscribe framework to send the event
                    main.sendSpeechText(final_transcript);

                    final_transcript = '';
                }
            }

        };
    } // if webkitSpeechRecognition

    function linebreak(s) {
        return s.replace(two_line, '<p></p>').replace(one_line, '<br>');
    }

    function capitalize(s) {
        return s.replace(first_char, function (m) { return m.toUpperCase(); });
    }
    function _ToggleSpeechToText(event) {
        if (recognizing) {
            recognition.stop();
            return;
        }
        final_transcript = '';
        //recognition.lang = select_dialect.value;
        recognition.lang = 'en-US';
        recognition.start();
        ignore_onend = false;
        STTResultsSpan.innerHTML = '';
        STTButtonImage.src = './img/mic-slash.gif';
        //showInfo('info_allow');
        //showButtons('none');
        start_timestamp = event.timeStamp;
    }

    //=================================================================================================================
    // This is what is exposed from this Module
    return {
    };

})(); // var speech = (function(){
