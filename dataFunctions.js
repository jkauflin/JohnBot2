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

function loadData(table) {
    esClient.get({
        index: 'bot',
        type: 'tableInfo',
        id: table
      }, function (error,response,status) {
        if (error) {
            console.log("Error getting tableInfo for table = "+table);
            console.log("Error = "+error);
            // found = false
            return;
        }

        var updTs = "2017-01-01";
        if (response.found == true) {
            updTs = response._source.updateTimestamp;
        } else {
            console.log("No tableInfo for table = "+table);
        }
            //console.log("id = "+response._id);
            //console.log("updateTimestamp = "+response._source.updateTimestamp);

            //console.log("url = "+botDataUrl+'?table='+table+'&lastupdate='+response._source.updateTimestamp);
            getJSON(botDataUrl+'?table='+table+'&lastupdate='+response._source.updateTimestamp, function(error, botResponses){
                if(error) {
                    //console.log("Error in loadData getJSON, err = "+error);
                }
                else {
                    //console.log("SUCCESSFUL call of getBotData.php");
                    //console.log(botResponses);
        
                    makebulk(botResponses,function(madebulk){
                        /*
                        console.log("Bulk content prepared");
                        console.log("madebulk = "+madebulk);
                        console.log("length = "+madebulk.length);
                        */
                        // Execute the bulk index load if there is anything to load
                        if (madebulk.length > 0) {
                            indexall(madebulk,function(response){
                                //console.log("indexall response:");
                                //console.log(response);
                                //Update last updated timestamp
                                //console.log("lastUpdate = "+dateTime.create().format('Y-m-d H:M:S'));
                                saveTableTimestamp(table,dateTime.create().format('Y-m-d H:M:S'));
                            })
                        }
                    });
        
                }
            });
        
    });
};

function saveTableTimestamp(table,timestamp) {
    esClient.index({
        index: 'bot',
        id: table,
        type: 'tableInfo',
        body: {
        'updateTimestamp': timestamp
        }
        },function(err,resp,status) {
        //console.log("saveTableTimestamp, timestamp = "+timestamp);
    });
}

var makebulk = function(botResponsesList,callback){
    for (var current in botResponsesList){
        // how do I know when the update is done - do I care?
        // log how many records were in the service call JSON response
        //console.log("id = "+botResponsesList[current].id);
        if (botResponsesList[current].deleted == "Y") {
            esClient.delete({
                index: 'bot',
                type: 'responses',
                id: botResponsesList[current].id
            },function(err,resp,status) {
                //console.log(resp);
            });
        } else {
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
            bulk.push(
                { index: {_index: 'bot', _type: 'responses', _id: botResponsesList[current].id } },
                {
                    'keywords': botResponsesList[current].keywords,
                    'verbalResponse': botResponsesList[current].verbalResponse,
                    'lastChangedTs': botResponsesList[current].lastChangedTs
                }
            );
        }
    }
    callback(bulk);
}

var indexall = function(madebulk,callback) {
    esClient.bulk({
        maxRetries: 5,
        index: 'bot',
        type: 'responses',
        body: madebulk
    },function(err,resp,status) {
        if (err) {
            console.log("Error in indexall, err = "+err);
        } else {
            callback(resp);
        }
    })
}

function esInfo() {
    esClient.cluster.health({},function(err,resp,status) {
        console.log("-- Client Health --",resp);
    });
    
    esClient.count({index: 'bot',type: 'responses'},function(err,resp,status) {
        console.log("Bot Responses: ",resp);
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



    
     
    
