var AWS = require("aws-sdk");

var conf = require('./conf');

AWS.config.update({
    region: "us-east-2",
    accessKeyId: conf.aws_key,
    secretAccessKey: conf.aws_secret_key    
  });

var docClient = new AWS.DynamoDB.DocumentClient();

table = "films";

async function getData(args) {
    var params = {
        TableName: table,
        Key:{
            "movie_id": args.id
        }
    };

    try {
        const response =  await docClient.get(params).promise();
        console.log(response.Item);
        return response.Item;
    } catch (err) {
        console.log(err);
        return null;
    }
}

async function scanData() {
    var params = {
        TableName: table,
        ProjectionExpression: "movie_id, title, popularity, release_date, rating, description"
    };

    try {
        const response =  await docClient.scan(params).promise();
        console.log(response.Items);
        return response.Items;
    } catch (err) {
        console.log(err);
        return null;
    }
}

module.exports.getData = getData;
module.exports.scanData = scanData;