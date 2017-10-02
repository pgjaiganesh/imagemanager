'use strict';

//include the config.js file which has the bucket website and API Gateway endpoints
const config = require('config');
const http = require('http');
const https = require('https');

exports.handler = (event, context, callback) => {
    const request = event.Records[0].cf.request;

    console.log("Request :%j",request);
    console.log("config %j",config);

    //set the S3 and API GW endpoints
    const BUCKET = config.image_bucket;
    const APIGW_URL = config.apigw_url+"?key=";
    const HOSTNAME = config.image_bucket_url.replace("http://","");

    console.log("Bucket :%s",BUCKET);
    console.log("Hostname :%s",HOSTNAME);

    //perform following action only for the /images/ path.
    if (request.uri.includes('images') == true) {

        console.log("Time remaining1 :%s",context.getRemainingTimeInMillis());

        //fetch the required path. Ex: uri /images/100x100/webp/image.jpg
        var path = request.uri;
        console.log("url :%s",path);

        var options = {
            hostname: HOSTNAME,
            path: path,
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

                //if image does not exist initiate a resize operation via API GW
                if(res.statusCode == 404){
                    /*read the S3 key from the path vaiable.
                    Ex: path variable /images/100x100/webp/image.jpg
                    */
                    let key = path.substring(1);
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
                else if(res.statusCode != 200){
                  /*for all other conditions when the API GW request did not complete with
                  success '200 Ok' fallback to the original image.
                  Ex: from incoming url /images/100x100/webp/image.jpg parse
                  original key /images/image.jpg
                  */
                  const match = path.match(/(.*)\/(\d+)x(\d+)\/(.*)\/(.*)/);
                  if(match){
                    request.uri = match[1]+"/"+match[5];
                    console.log("Falling back to original url %s",request.uri);
                  }
                }
            });
    }
    //allow the request to pass through for CloudFront to fetch the image from bucket
    callback(null, request);
    //}
};
