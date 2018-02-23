var getJSON = require('get-json');
var dateTime = require('node-datetime');
var fullTextSearch = require('full-text-search');
var search = new fullTextSearch({
  minimum_chars: 2      // default = 1, The less minimum chars you want to use for your search, the slower the 'add' method gets 
});
//ignore_case: false,   // default = true, Ignore case during all search queries 
//index_amount: 8,      // default = 12, The more indexes you have, the faster can be your search but the slower the 'add' method  gets 

// maybe do loadData as a top level, with only an error or callback if there is a problem
// top level should start load, load should load all tables and do a callback when all are completed
// successfully or if there is any problem

// Add objects 
/*
var obj = {
    name: 'Alexandra',
    age: 27,
    student: true,
    hobbies: ['Tennis', 'Football', 'Party'];
    car: {
        make: 'Volvo',
        year: 2012,
        topspeed: 280
    }
};
 
search.add(obj);


var results = search.search('p');
// results = ['Peter', 'Paul'] 

// Add returns an id 
var f = search.add("Frank");
 
// With that id you can remove the value from the search 
search.remove(f);
 
// Returns an array with all result objects 
var result = search.search('pau');
// result: ['Paul'] 


var fullTextSearch = require('full-text-search');
var search = new fullTextSearch();
 
// Add 
search.add('Hello World');
 
// Save current db 
search.saveSync('search.json');
 
// Load db 
var search_loaded = db.loadSync('search.json');
search_loaded.search('World');


search.drop()
search.saveSync('path/to/file.json')
db.loadSync('path/to/file.json')
*/

function loadData(inStr,callback){
    console.log("in loadData "+dateTime.create().format('H:M:S.N'));
    var responseStr = "loadData response string";
    var error = null;
    var status = null;

    /*
    esClient.get({
        index: 'bot',
        type: 'tableInfo',
        id: 'responses'
    }, loadTable);
    
    esClient.get({
        index: 'bot',
        type: 'tableInfo',
        id: 'jokes'
    }, loadTable);
    
    callback(error,responseStr,status);
    */

    // Keep a global flag in the main that is set to true when it gets this callback when all tables are loaded successfully

    loadTable('responses');
}; // function searchResponses(searchStr,callback){
    
function loadTable(table) {
    //var table = response._id;
    console.log(" ");
    console.log(dateTime.create().format('H:M:S.N')+" In loadTable");
    console.log(dateTime.create().format('H:M:S.N')+" table = "+table);
    /*
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

    var tempUrl = process.env.BOT_DATA_URL+'?table='+table+'&lastupdate='+updTs;
    console.log("botData url = "+tempUrl);
    getJSON(tempUrl, function(error, urlJsonResponse){
        if (error != null) {
            console.log("Error in getJSON, err = "+error);
        }
        else {
            //console.log(dateTime.create().format('H:M:S.N')+" SUCCESSFUL call of BOT_DATA_URL ");
            // Don't really need to check this here because makebulk loops through array (0 no loops)
            if (urlJsonResponse.length > 0) {
                console.log(dateTime.create().format('H:M:S.N')+" table = "+table+", urlJsonResponse.length = "+urlJsonResponse.length);

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
                           search.add(urlJsonResponse[current]);

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
            
                var searchStr = 'kill me';
                searchResponses(searchStr, function(results) {
                    console.log("return from searchResponses "+dateTime.create().format('Y-m-d H:M:S'));
                      console.log(results);
                      //audioFunctions.speakText(results);
                });
                

            } // if (urlJsonResponse.length > 0) {

            //console.log(urlJsonResponse);
            /*
            makebulk(table,urlJsonResponse,function(madebulk){
                // Execute the bulk index load if there is anything to load
                //console.log(" ");
                //console.log(dateTime.create().format('H:M:S.N')+" table = "+table+", madebulk.length = "+madebulk.length);
                //console.log(madebulk);
                if (madebulk.length > 0) {
                    esClient.bulk({
                        maxRetries: 5,
                        index: 'bot',
                        type: table,
                        body: madebulk
                    },function(error,response,status) {
                        if (error != null) {
                            console.log("Error in bulk index, err = "+error);
                        } else {
                            //console.log(dateTime.create().format('H:M:S.N')+" $$$ After callback from makebulk, table = "+table);
                            saveTableTimestamp(table,dateTime.create().format('Y-m-d H:M:S'));
                        }
                    })
                                    
                }
            }); // makebulk
            */

        } // Successful getJSON call
    }); // GetJSON
} // function loadTable(error,response,status) {


function saveTableTimestamp(table,timestamp) {
    /*
    esClient.index({
        index: 'bot',
        id: table,
        type: 'tableInfo',
        body: {
        'updateTimestamp': timestamp
        }
        },function(err,resp,status) {
        //console.log("*** saveTableTimestamp, timestamp = "+timestamp);
    });
    */
}

/*
var makebulk = function(table,urlJsonResponse,callback){
    // Create an empty array object
    var bulk = [];
    // Loop through the responses
    for (var current in urlJsonResponse){
        // how do I know when the update is done - do I care?
        // log how many records were in the service call JSON response
        //console.log("id = "+botResponsesList[current].id);
        if (urlJsonResponse[current].deleted == "Y") {
            esClient.delete({
                index: 'bot',
                type: table,
                id: urlJsonResponse[current].id
            },function(err,resp,status) {
                //console.log(resp);
            });
        } else {
            if (table == 'responses') {
                bulk.push(
                    { index: {_index: 'bot', _type: table, _id: urlJsonResponse[current].id } },
                    {
                        'keywords': urlJsonResponse[current].keywords,
                        'verbalResponse': urlJsonResponse[current].verbalResponse,
                        'lastChangedTs': urlJsonResponse[current].lastChangedTs
                    }
                );
            } else if (table == 'jokes') {
                bulk.push(
                    { index: {_index: 'bot', _type: table, _id: urlJsonResponse[current].id } },
                    {
                        'question': urlJsonResponse[current].question,
                        'answer': urlJsonResponse[current].answer,
                        'lastChangedTs': urlJsonResponse[current].lastChangedTs
                    }
                );
            } // table
        } // bulk push
    } // loop through JSON list
    callback(bulk);
}
*/


function searchResponses(searchStr,callback){
    console.log("in searchResponses, searchStr = "+searchStr);
    var responseStr = 'nothing';

    var result = search.search(searchStr);
    // result: ['Paul'] 
    console.log("result.length = "+result.length);    
    console.log("result = "+JSON.stringify(result));
    if (result.length > 0) {
        for (var current in result) {
            console.log("current = "+JSON.stringify(current));
        }
    }
    
    /*
    esClient.search({
        index: 'bot',
        type: 'responses',
        body: {
            query: {
            match: { "keywords": searchStr }
            // wildcard: { "constituencyname": "???wich" }
            // wildcard: { "constituencyname": "*leet*" }
            // regexp: { "constituencyname": ".+wich" }
            },
        }
    },function (error,response,status) {
        var responseStr = '';
        if (error != null) {
            console.log("search error: "+error)
        } else {
            if (response.hits.hits.length > 0) {
                responseStr = response.hits.hits[0]._source.verbalResponse;
            }
        }
        callback(responseStr);
    });
    */

}; // function searchResponses(searchStr,callback){
    

module.exports = {
    loadData,
    searchResponses
};

