var getJSON = require('get-json');
var dateTime = require('node-datetime');
var fullTextSearch = require('full-text-search');
var responsesSearch = new fullTextSearch({
  minimum_chars: 2      // default = 1, The less minimum chars you want to use for your search, the slower the 'add' method gets 
});
var jokesSearch = new fullTextSearch({
  minimum_chars: 2      // default = 1, The less minimum chars you want to use for your search, the slower the 'add' method gets 
});
//ignore_case: false,   // default = true, Ignore case during all search queries 
//index_amount: 8,      // default = 12, The more indexes you have, the faster can be your search but the slower the 'add' method  gets 


function loadData(inStr,callback){
    console.log("in loadData "+dateTime.create().format('H:M:S.N'));
    var responseStr = "loadData response string";
    var error = null;
    var status = null;

    // Keep a global flag in the main that is set to true when it gets this callback when all tables are loaded successfully
    //responsesSearch.loadSync(process.env.STORE_DIR+'responses-search.json');

    loadTable('responses');
    //loadTable('jokes');
}; // function searchResponses(searchStr,callback){
    
function loadTable(table) {
    //var table = response._id;
    /*
    console.log(" ");
    console.log(dateTime.create().format('H:M:S.N')+" In loadTable");
    console.log(dateTime.create().format('H:M:S.N')+" table = "+table);
    console.log(dateTime.create().format('H:M:S.N')+"    error = "+error);
    console.log(dateTime.create().format('H:M:S.N')+" response = "+response);
    console.log(dateTime.create().format('H:M:S.N')+"   status = "+status);
    if (error != null) {
        console.log("ERROR in callback");
    }
    */

    var updTs = "2017-01-01";
    /*
    if (response.found == true) {
        updTs = response._source.updateTimestamp;
    } else {
        console.log("No tableInfo for table = "+table);
    }
    */

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
                        /*
                        esClient.delete({
                            index: 'bot',
                            type: table,
                            id: urlJsonResponse[current].id
                        },function(err,resp,status) {
                            //console.log(resp);
                        });
                        */
                    } else {
                        if (table == 'responses') {
                            /*
                            bulk.push(
                                { index: {_index: 'bot', _type: table, _id: urlJsonResponse[current].id } },
                                {
                                    'keywords': urlJsonResponse[current].keywords,
                                    'verbalResponse': urlJsonResponse[current].verbalResponse,
                                    'lastChangedTs': urlJsonResponse[current].lastChangedTs
                                }
                            );
                            */
                           //console.log("JSON.stringify(urlJsonResponse[current]) = "+JSON.stringify(urlJsonResponse[current]));
                           responsesSearch.add(urlJsonResponse[current]);

                        } else if (table == 'jokes') {
                            /*
                            bulk.push(
                                { index: {_index: 'bot', _type: table, _id: urlJsonResponse[current].id } },
                                {
                                    'question': urlJsonResponse[current].question,
                                    'answer': urlJsonResponse[current].answer,
                                    'lastChangedTs': urlJsonResponse[current].lastChangedTs
                                }
                            );
                            */
                        } // table
                    } // bulk push
                
                } // loop through JSON list
            
                // When I want to save to a file
                //responsesSearch.saveSync(process.env.STORE_DIR+'responses-search.json');

            } // if (urlJsonResponse.length > 0) {

        } // Successful getJSON call
    }); // GetJSON
} // function loadTable(error,response,status) {


function searchResponses(searchStr,callback){
    //console.log("in searchResponses, searchStr = "+searchStr);
    var responseStr = 'nothing';

    var result = responsesSearch.search(searchStr);
    // result: ['Paul'] 
    //console.log("result.length = "+result.length);    
    //console.log("result = "+JSON.stringify(result));
    if (result.length > 0) {
        //console.log("result[0].id = "+result[0].id);
        /*
        for (var current in result) {
            console.log("current = "+JSON.stringify(current));
        }
        */
        callback(result[0].verbalResponse);
    }

/*    
    result = [{"id":"15",
               "deleted":"N",
               "keywords":"snake snakes loki thor kill me",
               "verbalResponse":"Loki was always trying to kill me.  Once when we were children he turned into a snake, and I love snakes and I went to hug it, then he turned back into Loki and said Aaahhh, and stabbed me.",
               "lastChangedTs":"2017-12-26 16:32:37"}]
*/


}; // function searchResponses(searchStr,callback){
    

module.exports = {
    loadData,
    searchResponses
};

