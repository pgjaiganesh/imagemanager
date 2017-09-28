'use strict';

//include the config.js file which has the bucket website and API Gateway endpoints
const config = require('config');
const http = require('http');
const https = require('https');

exports.handler = (event, context, callback) => {
    const request = event.Records[0].cf.request;

    console.log("Request :%j",request);

    console.log("config %j",config);
    const BUCKET = config.image_bucket;
    const APIGW_URL = config.apigw_url+"?key=";
    const HOSTNAME = config.image_bucket_url.replace("http://","");

    console.log("Bucket :%s",BUCKET);
    console.log("Hostname :%s",HOSTNAME);

    let key = request.uri.substring(1);
    //perform following action only for the /images/ path.
    if (request.uri.includes('images') == true) {

        console.log("Time remaining1 :%s",context.getRemainingTimeInMillis());

        //var path1 = "/"+config.image_bucket+request.uri;
        var path1 = request.uri;
        console.log("s3 url :%s",path1);

        var options = {
            hostname: HOSTNAME,
            path: path1,
            port: 80,
            method: 'HEAD'
        };
        //make a HTTP HEAD request to check for presence of the object.
        http.get(options, (res) => {
                console.log("Status code :%s",res.statusCode);
                console.log("Time remaining1.1 :%s",context.getRemainingTimeInMillis());
                res.on('data', (chunk) => {});
                res.on('end', () => {
                    console.log("Made http call");
                });

                //if image does not exist initiate a create via API GW
                if(res.statusCode != 200){
                    const templateUrl = APIGW_URL+key;
                    console.log("API Call : %j",templateUrl);

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
    }
    //allow the request to pass through for CloudFront to fetch the image from bucket
    callback(null, request);
    //}
};
