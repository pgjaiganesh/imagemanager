'use strict';

const fs = require('fs');
const config = require('config')
const https = require('https');
const AWS = require('aws-sdk');
const S3 = new AWS.S3({
  signatureVersion: 'v4',
});

console.log("Bucket %s",BUCKET);
exports.handler = (event, context, callback) => {
    const request = event.Records[0].cf.request;

    console.log("Request :%j",request);
    console.log("Region  :%s",process.env.AWS_DEFAULT_REGION);

    console.log("config %j",config);
    const BUCKET = config.image_bucket;
    const APIGW_URL = config.apigw_url+"?key=";

    let key = request.uri.substring(1);
    if (request.uri.includes('images') == true) {

        console.log("Time remaining1 :%s",context.getRemainingTimeInMillis());

        var params = {
          Bucket: BUCKET,
          MaxKeys: 1,
          Prefix: key,
        };

        S3.listObjectsV2(params, function(err, data) {
          if (err) console.log(err, err.stack); // an error occurred
          else{
              console.log(data);           // successful response
              if(data.KeyCount == 0){
                    console.log("Object does not exist :%s",key);
                    console.log("Time remaining2 :%s",context.getRemainingTimeInMillis());

                    const templateUrl = APIGW_URL+key;
                    console.log("API Call : %j",templateUrl);
                    //console.log("Time remaining2 :%s",context.getRemainingTimeInMillis());
                    console.log("Function name :%s",context.functionName);

                    https.get(templateUrl, (res) => {
                        let content = '';
                        res.on('data', (chunk) => { content += chunk; });
                        res.on('end', () => {
                            console.log("API Called :%j",content);
                        });
                    });
                    console.log("Time remaining3 :%s",context.getRemainingTimeInMillis());

              }
              else{
                    console.log("Time remaining1.2 :%s",context.getRemainingTimeInMillis());

              }
          }
        });
    }
    console.log("Test");

    callback(null, request);
    //}
};
