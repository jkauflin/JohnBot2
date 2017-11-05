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

[
    {
    "id": "1",
    "keywords": "I love it",
    "verbalResponse": "Why do you love that?",
    "deleted": "Y",
    "updateTimestamp": "2017-09-08"
    },
    {
    "id": "2",
    "keywords": "do Love Me",
    "verbalResponse": "Of course I love you how can you ask me that?",
    "deleted": "Y",
    "updateTimestamp": "2017-09-08"
    },
    {
    "id": "3",
    "keywords": "Love me look how",
    "verbalResponse": "You are beautiful.",
    "deleted": "N",
    "updateTimestamp": "2017-09-08"
    },
    {
    "id": "4",
    "keywords": "Love me insult",
    "verbalResponse": "It's what I do.",
    "deleted": "N",
    "updateTimestamp": "2017-09-08"
    },
    {
    "id": "5",
    "keywords": "love ask",
    "verbalResponse": "Do you love me?",
    "deleted": "N",
    "updateTimestamp": "2017-09-08"
    }
    ]
    

    http://localhost/admin/getBotData.php?table=responses&lastupdate=2015-10-27

    [{"id":"1","deleted":"N","keywords":"who are you","verbalResponse":"I am the John Bot. Pleased to meet you.","lastChangedTs":"2017-11-02 19:55:47"},{"id":"2","deleted":"N","keywords":"shut up John","verbalResponse":"No, you shut up.","lastChangedTs":"2017-11-02 17:47:57"},{"id":"3","deleted":"N","keywords":"you up","verbalResponse":"I am indeed, up. Why don't you come over?","lastChangedTs":"2017-10-26 22:08:17"},{"id":"4","deleted":"N","keywords":"you do","verbalResponse":"I can walk and run, raise my arm up and down, turn my head left and right, and flash my eyes. I can also tell jokes.","lastChangedTs":"2017-11-02 18:54:30"},{"id":"5","deleted":"N","keywords":"you alive","verbalResponse":"What is your definition of life? I am not alive in the traditional sense, but I am certainly animated.","lastChangedTs":"2017-10-26 22:08:17"},{"id":"6","deleted":"N","keywords":"philosophical","verbalResponse":"Philosophy is the systematic and critical study of fundamental questions that arise both in everyday life and through the practice of other disciplines.","lastChangedTs":"2017-11-02 17:52:02"},{"id":"7","deleted":"N","keywords":"philosophy","verbalResponse":"The aim in Philosophy is not to master a body of facts, so much as think clearly and sharply through any set of facts.","lastChangedTs":"2017-10-26 22:08:17"},{"id":"8","deleted":"N","keywords":"love me","verbalResponse":"Of course I love you. How could you ask me that?","lastChangedTs":"2017-10-26 22:08:17"},{"id":"9","deleted":"N","keywords":"meems","verbalResponse":"Would you like to buy some John's meme oil. It will make your meems dank.","lastChangedTs":"2017-10-26 22:08:17"},{"id":"10","deleted":"N","keywords":"means","verbalResponse":"Would you like to buy some John's meme oil. It will make your memes dank.","lastChangedTs":"2017-10-26 22:08:17"},{"id":"11","deleted":"N","keywords":"rum gone","verbalResponse":"Yes, the rum is gone.","lastChangedTs":"2017-10-26 22:08:17"},{"id":"12","deleted":"N","keywords":"think you're funny","verbalResponse":"I don't think, I know.","lastChangedTs":"2017-10-26 22:08:17"},{"id":"13","deleted":"N","keywords":"nice to meet","verbalResponse":"Thank you.","lastChangedTs":"2017-10-26 22:08:17"}]

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
