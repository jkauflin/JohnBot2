var esClient = require('./dataConnection.js');

esClient.indices.create({
    index: 'bot'
},function(err,resp,status) {
    if(err) {
        console.log(err);
    } else {
        console.log("create",resp);
    }
});
