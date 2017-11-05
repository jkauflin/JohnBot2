var getJSON = require('get-json');
var dateTime = require('node-datetime');
var esClient = require('./dataConnection.js');
//var inputfile = require('./bot_responses.json');
var inputfile = '';

var bulk = [];
var dt = dateTime.create();
var formatted = dt.format('Y-m-d H:M:S');
console.log("Formated datetime = "+formatted);

/*
{"id":"13",
"deleted":"N",
"keywords":"nice to meet",
"verbalResponse":"Thank you.",
"lastChangedTs":"2017-10-26 22:08:17"}
*/
 
var makebulk = function(botresponseslist,callback){
    for (var current in botresponseslist){
        // how do I know when the update is done - do I care?
        // log how many records were in the service call JSON response
        //console.log("id = "+botresponseslist[current].id);
        if (botresponseslist[current].deleted == "Y") {
            esClient.delete({
                index: 'bot',
                type: 'responses',
                id: botresponseslist[current].id
            },function(err,resp,status) {
                console.log(resp);
            });
        } else {
            /*
            esClient.index({
            index: 'bot',
            id: botresponseslist[current].id,
            type: 'responses',
            body: {
            'keywords': botresponseslist[current].keywords,
            'verbalResponse': botresponseslist[current].verbalResponse,
            'updateTimestamp': botresponseslist[current].verbalResponse
            }
            },function(err,resp,status) {
            console.log(resp);
            });
            */
            bulk.push(
                { index: {_index: 'bot', _type: 'responses', _id: botresponseslist[current].id } },
                {
                    'keywords': botresponseslist[current].keywords,
                    'verbalResponse': botresponseslist[current].verbalResponse,
                    'lastChangedTs': botresponseslist[current].lastChangedTs
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
            console.log(err);
        } else {
            //callback(resp.items);
            callback(resp);
        }
    })
}

/*
makebulk(inputfile,function(madebulk){
    console.log("Bulk content prepared");
    indexall(madebulk,function(response){
        console.log("index all response:");
        console.log(response);
    })
});
*/


function loadData() {
    getJSON('http://localhost/admin/getBotData.php', function(error, botResponses){
        if(error) {
            console.log(error);
        }
        else {
            console.log("SUCCESSFUL call of PHP");
            //console.log(response);
            //results(response.result.parliamentary_constituency,function(response){
            //callback(response);
            //});

            makebulk(botResponses,function(madebulk){
                console.log("Bulk content prepared");
                indexall(madebulk,function(response){
                    console.log("index all response:");
                    console.log(response);
                })
            });

        }
    });
};

/*
esClient.cluster.health({},function(err,resp,status) {
    console.log("-- Client Health --",resp);
});

esClient.count({index: 'bot',type: 'responses'},function(err,resp,status) {
    console.log("Bot Responses: ",resp);
});


search
var searchKeywords = "meems";
esClient.search({
    index: 'bot',
    type: 'responses',
    body: {
        query: {
        match: { "keywords": searchKeywords }
        // wildcard: { "constituencyname": "???wich" }
        // wildcard: { "constituencyname": "*leet*" }
        // regexp: { "constituencyname": ".+wich" }
        },
    }
},function (error, response,status) {
    if (error){
        console.log("search error: "+error)
    } else {
        console.log("--- Response --- for: "+searchKeywords);
        //console.log(response);
        console.log("--- Hits ---");
        response.hits.hits.forEach(function(hit){
        console.log(hit._id+", Score ="+hit._score+" ===============================================");
        console.log("requestKeywords = "+hit._source.keywords);
        console.log(" responseSpeech = "+hit._source.verbalResponse);
        console.log(hit);
    })
}
});

*/

module.exports = {
    loadData
};
