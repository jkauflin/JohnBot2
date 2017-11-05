/*==============================================================================
 * (C) Copyright 2017 John J Kauflin, All rights reserved. 
 *----------------------------------------------------------------------------
 * DESCRIPTION: 
 *----------------------------------------------------------------------------
 * Modification History
 * 2017-09-08 JJK 	Initial version 
 *============================================================================*/

// Global variables
var HDphotos = false;

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

function waitCursor() {
    $('*').css('cursor', 'progress');
    $(".ajaxError").html("");
}

$(document).ajaxError(function(e, xhr, settings, exception) {
	console.log("ajax exception = "+exception);
	console.log("ajax exception xhr.responseText = "+xhr.responseText);
    $(".ajaxError").html("An Error has occurred (see console log)");
});


$(document).ready(function(){

	// 2017-04-03 JJK - Implement this when needed for polyfills
	// load and implement all unsupported features 
	//webshims.polyfill();
	//webshim.polyfill('mediaelement');

	// Auto-close the collapse menu after clicking a non-dropdown menu item (in the bootstrap nav header)
	$(document).on('click','.navbar-collapse.in',function(e) {
	    if( $(e.target).is('a') && $(e.target).attr('class') != 'dropdown-toggle' ) {
	        $(this).collapse('hide');
	    }
	});
	

      
}); // $(document).ready(function(){


