var elasticsearch=require('elasticsearch');
var esClient = new elasticsearch.Client( {
    hosts: [
    'http://localhost:9200/'
    ]
});
module.exports = esClient;
