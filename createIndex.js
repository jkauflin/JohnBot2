var esClient = require('./dataConnection.js');

/*
esClient.indices.create({
    index: 'bot'
},function(err,resp,status) {
    if(err) {
        console.log(err);
    } else {
        console.log("create",resp);
    }
});
*/

/*
esClient.indices.create({
    index: 'lastupdated'
},function(err,resp,status) {
    if(err) {
        console.log(err);
    } else {
        console.log("create",resp);
    }
});

esClient.indices.delete({index: 'lastupdated'},function(err,resp,status) {  
    console.log("delete",resp);
});
esClient.indices.delete({index: 'bot'},function(err,resp,status) {  
    console.log("delete",resp);
});
esClient.indices.delete({index: 'bot_responses'},function(err,resp,status) {  
    console.log("delete",resp);
});

*/
