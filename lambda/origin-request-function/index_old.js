'use strict';

const fs = require('fs');
const config = require('config')
const https = require('https');
const http = require('http');

const AWS = require('aws-sdk');
const S3 = new AWS.S3({
  signatureVersion: 'v4',
  region: 'ap-south-1'
});

exports.handler = (event, context, callback) => {
    const request = event.Records[0].cf.request;

    console.log("Request :%j",request);
    console.log("Region  :%s",process.env.AWS_DEFAULT_REGION);

    console.log("config %j",config);
    const BUCKET = config.image_bucket;
    const APIGW_URL = config.apigw_url+"?key=";

    console.log("Bucket %s",BUCKET);

    let key = request.uri.substring(1);
    if (request.uri.includes('images') == true) {

        console.log("Time remaining1 :%s",context.getRemainingTimeInMillis());

        var path1 = "/"+config.image_bucket+request.uri;
        console.log("s3 url :%s",path1);

        var options = {
            hostname: 's3.ap-south-1.amazonaws.com',
            path: path1,
            port: 80,
            method: 'HEAD'
        };

        var statusCode;
        http.get(options, (res) => {
                console.log("Status code :%s",res.statusCode);
                console.log("Time remaining1.1 :%s",context.getRemainingTimeInMillis());
                statusCode = res.statusCode;

                res.on('data', (chunk) => {});
                res.on('end', () => {
                    console.log("Made http call");
                });

                console.log("status code :%s",statusCode);
            
                if(statusCode == 404){
                    const templateUrl = APIGW_URL+key;
                    console.log("API Call : %j",templateUrl);
                    console.log("Function name :%s",context.functionName);

                    https.get(templateUrl, (res) => {
                        let content = '';
                        res.on('data', (chunk) => { content += chunk; });
                        res.on('end', () => {
                            console.log("API Called :%s",content);
                        });
                        console.log("Time remaining2 :%s",context.getRemainingTimeInMillis());
                    });
                }
            });
        /*S3.getObjectAcl({Bucket: BUCKET, Key: key}).promise()
        .then(data => {
            //console.log("Key exist :"+key+" Content type1 :"+data.ContentType+" "+data.ContentLength);
            console.log("Key exist :"+key);
            console.log("Time remaining1.1 :%s",context.getRemainingTimeInMillis());

        })
        .catch(err => {
            console.log("Object does not exist :%s",key);

        const templateUrl = APIGW_URL+key;
        console.log("API Call : %j",templateUrl);
        console.log("Time remaining2 :%s",context.getRemainingTimeInMillis());
        console.log("Function name :%s",context.functionName);

        https.get(templateUrl, (res) => {
            let content = '';
            res.on('data', (chunk) => { content += chunk; });
            res.on('end', () => {
                console.log("API Called :%s",content);
            });
        });
      });*/
    }

    callback(null, request);
    //}
};
