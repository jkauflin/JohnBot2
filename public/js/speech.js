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
 *                  Added TTS capabilities through window speechSynthesis
 * 2018-12-28 JJK   Added cancel of speech before starting another utterance
 * 2018-02-10 JJK   Got continuous recognition working fairly well
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
    var speechSynth = window.speechSynthesis;
    var recognition = new webkitSpeechRecognition();
    //if (!('webkitSpeechRecognition' in window)) {
    //    console.log("webkitSpeechRecognition not supported");
    //if (window.hasOwnProperty('webkitSpeechRecognition')) {

    var initialStart = true;
    var speaking = false;

    //=================================================================================================================
    // Variables cached from the DOM
    var $document = $(document);
    var $SpeechToTextButton = $document.find("#SpeechToTextButton");
    var $ContinuousListening = $document.find("#ContinuousListening");

    //=================================================================================================================
    // Bind events
    $SpeechToTextButton.click(_ToggleSpeechToText);

    recognition.lang = 'en-US';
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
            /*
            if (event.timeStamp - start_timestamp < 100) {
                //showInfo('info_blocked');
            } else {
                //showInfo('info_denied');
            }
            */
            ignore_onend = true;
        }
    };

    recognition.onend = function () {
        //console.log("*** recognition.onend ***");
        recognizing = false;

        // Check to restart recognizer if in continuous mode
        if ($ContinuousListening.prop('checked') && !speaking) {
            ignore_onend = false;
            STTResultsSpan.innerHTML = '';
            recognition.start();
        }

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
        // Don't capitalize - leave lowercase
        //final_transcript = capitalize(final_transcript);
        STTResultsSpan.innerHTML = linebreak(final_transcript);
        if (final_transcript || interim_transcript) {
            if (final_transcript) {
                //console.log(">>> onresult, final_transcript = " + final_transcript);
                // *** tightly coupled to a function in main right now, but could implement
                // *** a publish/subscribe framework to send the event
                main.handleTextFromSpeech(final_transcript);
                final_transcript = '';
            }
        }

    };

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
        recognition.start();
        ignore_onend = false;
        STTResultsSpan.innerHTML = '';
        STTButtonImage.src = './img/mic-slash.gif';
        //start_timestamp = event.timeStamp;
    }

    function speakText(textToSpeak) {
        //console.log("in speech.speakText, text = "+textToSpeak);

        // Turn off the speech recognition first before text to speech
        if (recognizing) {
            //console.log("$$$ aborting recognition (before speaking)");
            recognition.abort();
        }

        // Cancel any previously queued utterances
        speechSynth.cancel();

        // Create an utterance and speak it
        // Good documentation: https://flaviocopes.com/speech-synthesis-api/
        // 12/22/2018 - Add UM to the beginning to deal with delay sending to bluetooth speakers
        //var utterance = new SpeechSynthesisUtterance("um, "+textToSpeak);
        var utterance = new SpeechSynthesisUtterance(textToSpeak);
        // Just using defaults for voice, pitch, and rate
        speechSynth.speak(utterance);
        speaking = true;

        /*
        var utterance1 = new SpeechSynthesisUtterance('How about we say this now? This is quite a long sentence to say.');
        var utterance2 = new SpeechSynthesisUtterance('We should say another sentence too, just to be on the safe side.');
        synth.speak(utterance1);
        synth.speak(utterance2);
        synth.cancel(); // utterance1 stops being spoken immediately, and both are removed from the queue
        */

        // something that says when utterance is done?
        utterance.onend = function (event) {
            //console.log('Utterance has finished being spoken after ' + event.elapsedTime + ' milliseconds.');
            speaking = false;
            // Make sure the recognition is restarted
            ignore_onend = false;
            STTResultsSpan.innerHTML = '';
            recognition.start();
        }
        //utterance.onstart = function (event) {
        //    console.log('We have started uttering this speech: ' + event.utterance.text);
        //}

    } // function speakText(textToSpeak) {

    //=================================================================================================================
    // This is what is exposed from this Module
    return {
        speakText
    };

})(); // var speech = (function(){
