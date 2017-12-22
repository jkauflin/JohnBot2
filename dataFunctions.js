var getJSON = require('get-json');
var dateTime = require('node-datetime');
var esClient = require('./dataConnection.js');
//var inputfile = require('./bot_responses.json');
var bulk = [];
//var dt = dateTime.create();
//var formatted = dt.format('Y-m-d H:M:S');
var botDataUrl = "http://johnkauflin.com/getBotDataProxy.php";

// maybe do loadData as a top level, with only an error or callback if there is a problem
// top level should start load, load should load all tables and do a callback when all are completed
// successfully or if there is any problem

function loadData(inStr,callback){
    console.log("in loadData "+dateTime.create().format('Y-m-d H:M:S'));
    var responseStr = "loadData response string";
    var error = null;
    var status = null;

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
    // Keep a global flag in the main that is set to true when it gets this callback when all tables are loaded successfully
}; // function searchResponses(searchStr,callback){
    
function loadTable(error,response,status) {
    var table = response._id;
    console.log(" ");
    console.log(dateTime.create().format('Y-m-d H:M:S')+" In loadTable");
    console.log(dateTime.create().format('Y-m-d H:M:S')+" Callback from esClient.get, table = "+table);
    console.log(dateTime.create().format('Y-m-d H:M:S')+"    error = "+error);
    console.log(dateTime.create().format('Y-m-d H:M:S')+" response = "+response);
    console.log(dateTime.create().format('Y-m-d H:M:S')+"   status = "+status);
    if (error != null) {
        console.log("ERROR in callback");
    }

    var updTs = "2017-01-01";
    if (response.found == true) {
        updTs = response._source.updateTimestamp;
    } else {
        console.log("No tableInfo for table = "+table);
    }

    var tempUrl = botDataUrl+'?table='+table+'&lastupdate='+updTs;
    console.log("botData url = "+tempUrl);
    getJSON(tempUrl, function(error, urlJsonResponse){
        if (error != null) {
            console.log("Error in getJSON, err = "+error);
        }
        else {
            console.log("SUCCESSFUL call of getBotData.php");
            // Don't really need to check this here because makebulk loops through array (0 no loops)
            //if (urlJsonResponse.length > 0) {
            //console.log(urlJsonResponse);
                
            makebulk(table,urlJsonResponse,function(madebulk){
                // Execute the bulk index load if there is anything to load
                if (madebulk.length > 0) {
                    /*
                    indexall(table,madebulk,function(response){
                        saveTableTimestamp(table,dateTime.create().format('Y-m-d H:M:S'));
                    })
                    */
                    esClient.bulk({
                        maxRetries: 5,
                        index: 'bot',
                        type: table,
                        body: madebulk
                    },function(error,response,status) {
                        if (error != null) {
                            console.log("Error in bulk index, err = "+error);
                        } else {
                            saveTableTimestamp(table,dateTime.create().format('Y-m-d H:M:S'));
                        }
                    })
                                    
                }
            }); // makebulk
            
        } // Successful getJSON call
    }); // GetJSON
} // function loadTable(error,response,status) {


function saveTableTimestamp(table,timestamp) {
    esClient.index({
        index: 'bot',
        id: table,
        type: 'tableInfo',
        body: {
        'updateTimestamp': timestamp
        }
        },function(err,resp,status) {
        console.log("*** saveTableTimestamp, timestamp = "+timestamp);
    });
}

var makebulk = function(table,urlJsonResponse,callback){
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


function esInfo() {
    /*
    esClient.cluster.health({},function(err,resp,status) {
        console.log("-- Client Health --",resp);
    });
    */
    esClient.count({index: 'bot',type: 'responses'},function(err,resp,status) {
        console.log("Bot Responses: ",resp);
    });

    esClient.count({index: 'bot',type: 'jokes'},function(err,resp,status) {
        console.log("Bot Jokes: ",resp);
    });

    esClient.count({index: 'bot',type: 'tableInfo'},function(err,resp,status) {
        console.log("Bot TableInfo: ",resp);
    });
};

function searchResponses(searchStr,callback){
    //console.log("in searchResponses "+dateTime.create().format('Y-m-d H:M:S'));
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
        if (error) {
            //console.log("search error: "+error)
        } else {
            //console.log("response.hits.hits.length = "+response.hits.hits.length);
            if (response.hits.hits.length > 0) {
                responseStr = response.hits.hits[0]._source.verbalResponse;
            }

            /*
            console.log("--- Response --- for: "+searchStr);
            console.log("--- Hits ---");
            response.hits.hits.forEach(function(hit,index){
                console.log(hit._id+", Score ="+hit._score+" ===============================================");
                console.log("requestKeywords = "+hit._source.keywords);
                console.log(" responseSpeech = "+hit._source.verbalResponse);
                console.log(hit);
                if (index == 0) {
                    responseStr = hit._source.verbalResponse;
                }
            });
            */
        }
        callback(responseStr);
    });

}; // function searchResponses(searchStr,callback){
    

module.exports = {
    loadData,
    esInfo,
    searchResponses
};

            /*
            esClient.index({
            index: 'bot',
            id: botResponsesList[current].id,
            type: 'responses',
            body: {
            'keywords': botResponsesList[current].keywords,
            'verbalResponse': botResponsesList[current].verbalResponse,
            'updateTimestamp': botResponsesList[current].verbalResponse
            }
            },function(err,resp,status) {
            console.log(resp);
            });
            */
