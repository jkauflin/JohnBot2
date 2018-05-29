var getJSON = require('get-json');
var dateTime = require('node-datetime');
var fullTextSearch = require('full-text-search');
var responsesFilename = process.env.STORE_DIR+'responses-search.json';
var responsesSearch = null;
var fs = require('fs');
if (fs.existsSync(responsesFilename)) {
    responsesSearch = fullTextSearch.loadSync(responsesFilename); 
    //console.log("reloaded responses form file");
} else {
    //console.log("responsesSearch file not found - calling loadResponses");
    loadResponses();
}
//var jokesSearch = 

function loadData(inStr,callback){
    console.log("in loadData "+dateTime.create().format('H:M:S.N'));
    var responseStr = "loadData response string";
    var error = null;
    var status = null;

    //loadTable('responses');
    //loadTable('jokes');
    loadResponses();
}; // function searchResponses(searchStr,callback){

function loadResponses() {
    responsesSearch = new fullTextSearch({
        minimum_chars: 2      // default = 1, The less minimum chars you want to use for your search, the slower the 'add' method gets 
    });
    //ignore_case: false,   // default = true, Ignore case during all search queries 
    //index_amount: 8,      // default = 12, The more indexes you have, the faster can be your search but the slower the 'add' method  gets 

    var updTs = "2017-01-01";
    var table = "responses";
    var tempUrl = process.env.BOT_DATA_URL+'?table='+table+'&lastupdate='+updTs+'&uid='+process.env.UID;
    //console.log("botData url = "+tempUrl);
    getJSON(tempUrl, function(error, urlJsonResponse){
        if (error != null) {
            console.log("Error in getJSON, err = "+error);
        }
        else {
            //console.log(dateTime.create().format('H:M:S.N')+" SUCCESSFUL call of BOT_DATA_URL ");
            // Don't really need to check this here because makebulk loops through array (0 no loops)
            if (urlJsonResponse.length > 0) {
                //console.log(dateTime.create().format('H:M:S.N')+" table = "+table+", urlJsonResponse.length = "+urlJsonResponse.length);
                for (var current in urlJsonResponse){
                    // how do I know when the update is done - do I care?
                    // log how many records were in the service call JSON response
                    //console.log("id = "+botResponsesList[current].id);
                    if (urlJsonResponse[current].deleted == "Y") {
                        // delete?
                    } else {
                        //console.log("JSON.stringify(urlJsonResponse[current]) = "+JSON.stringify(urlJsonResponse[current]));
                        responsesSearch.add(urlJsonResponse[current]);
                    } // bulk push
                } // loop through JSON list
            
                // Save data to a file
                responsesSearch.saveSync(responsesFilename);

            } // if (urlJsonResponse.length > 0) {

        } // Successful getJSON call
    }); // GetJSON
} // 

                            /* jokes
                            bulk.push(
                                { index: {_index: 'bot', _type: table, _id: urlJsonResponse[current].id } },
                                {
                                    'question': urlJsonResponse[current].question,
                                    'answer': urlJsonResponse[current].answer,
                                    'lastChangedTs': urlJsonResponse[current].lastChangedTs
                                }
                            );
                            */

function searchResponses(searchStr,callback){
    //console.log("in searchResponses, searchStr = "+searchStr);
    var responseStr = 'I am not programmed to respond in this area.';

    var result = responsesSearch.search(searchStr);
    // result: ['Paul'] 
    //console.log("result.length = "+result.length);    
    //console.log("result = "+JSON.stringify(result));
    if (result.length > 0) {
        //console.log("result[0].id = "+result[0].id);
        /*
        result = [{"id":"15",
               "deleted":"N",
               "keywords":"snake snakes loki thor kill me",
               "verbalResponse":"Loki was always trying to kill me.  Once when we were children he turned into a snake, and I love snakes and I went to hug it, then he turned back into Loki and said Aaahhh, and stabbed me.",
               "lastChangedTs":"2017-12-26 16:32:37"}]

        for (var current in result) {
            console.log("current = "+JSON.stringify(current));
        }
        */
        responseStr = result[0].verbalResponse;
    }

    callback(responseStr);
}; // function searchResponses(searchStr,callback){
    
module.exports = {
    loadData,
    searchResponses
};

