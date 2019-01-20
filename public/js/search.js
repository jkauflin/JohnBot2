/*==============================================================================
 * (C) Copyright 2018 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: Client-side JS functions and logic for JohnBot2
 *----------------------------------------------------------------------------
 * Modification History
 * 2018-12-28 JJK 	Initial version 
 *============================================================================*/
var search = (function () {
	'use strict';  // Force declaration of variables before use (among other things)
	//=================================================================================================================
	// Private variables for the Module
	/*
	var docs = [
		{ "id": "1", "keywords": "who what are you your name", 
			"verbalResponse": "I am the John Bot. Pleased to meet you." },
		{ "id": "2", "keywords": "shut up", 
			"verbalResponse": "No, you shut up." },
		{ "id": "3", "keywords": "what can you do", 
			"verbalResponse": "I can walk, raise my arm, turn my head, and flash my eyes. I can also tell jokes." },
		{ "id": "4", "keywords": "alive", 
			"verbalResponse": "What is your definition of life? I am not alive in the traditional sense, but I am certainly animated." },
		{ "id": "5", "keywords": "philosophical", 
			"verbalResponse": "Philosophy is the systematic and critical study of fundamental questions that arise both in everyday life and through the practice of other disciplines." },
		{ "id": "6", "keywords": "philosophy", 
			"verbalResponse": "The aim in Philosophy is not to master a body of facts, so much as think clearly and sharply through any set of facts." },
		{ "id": "7", "keywords": "love me", 
			"verbalResponse": "Of course I love you. How could you ask me such a question?" },
		{ "id": "8", "keywords": "dank meems means", 
			"verbalResponse": "Would you like to buy some John's meem oil? It will make your meems dank." },
		{ "id": "9", "keywords": "rum gone", 
			"verbalResponse": "Yes, the rum is gone." },
		{ "id": "10", "keywords": "think funny", 
			"verbalResponse": "I don't think, I know." },
		{ "id": "11", "keywords": "nice to meet", 
			"verbalResponse": "Thank you." },
		{ "id": "12", "keywords": "you like", 
			"verbalResponse": "I'd like to teach the world to sing." },
		{ "id": "13", "keywords": "snake snakes loki thor kill me", 
			"verbalResponse": "Loki was always trying to kill me. Once when we were children he turned into a snake, and I love snakes and I went to hug it, then he turned back into Loki and said awe, and stabbed me." },
		{ "id": "14", "keywords": "that funny", 
			"verbalResponse": "Yes, I know that it is." },
		{ "id": "15", "keywords": "that true", 
			"verbalResponse": "Yes it is." },
		{ "id": "16", "keywords": "how are you", 
			"verbalResponse": "I am well thank you" },
		{ "id": "17", "keywords": "hello", 
			"verbalResponse": "hello to you" }
	]

	var idx = lunr(function () {
		this.ref('id')
		this.field('keywords')
		docs.forEach(function (doc) {
			this.add(doc)
		}, this)
	});

	// https://dev.niamurrell.com/tutorials/2018-01-01-adding-search-engine-to-static-site/
//https://olivernn.github.io/moonwalkers/

	var searchTerm = "what can";
	var results = idx.search(searchTerm);
	console.log("searchTerm = "+searchTerm);

	var i = 0;
	results.forEach(function (result) {
		//var item = loaded_data[result.ref];
		i = parseInt(result.ref) - 1;
		console.log('ref = ' + result.ref + ", score = " + result.ref + "  keywords = " + docs[i].keywords + ", verbal = " + docs[i].verbalResponse);
	});
	*/

	//=================================================================================================================
	// Variables cached from the DOM
	//var $document = $(document);
	//var $StatusDisplay = $document.find("#StatusDisplay");

	//=================================================================================================================
	// Bind events

	//=================================================================================================================
	// Module methods

	// Respond to string recognized by speech to text
	//function doneSpeaking(speechText) {
	//	_wsSend('{"doneSpeaking" : 1}');
	//}


	//=================================================================================================================
	// This is what is exposed from this Module
	return {
	};

})(); // var search = (function(){
