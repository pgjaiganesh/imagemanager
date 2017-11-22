'use strict';

//include the config.js file which has the bucket website and API Gateway endpoints
const config = require('config');
const http = require('http');
const https = require('https');

const AWS = require('aws-sdk');
const S3 = new AWS.S3({
  signatureVersion: 'v4',
});
const Sharp = require('sharp');

exports.handler = (event, context, callback) => {
    const request = event.Records[0].cf.request;
    const queryString = request.querystring;

    console.log("Request :%j",request);

    //parse the dimensions - width x height
    const dimensionMatch = queryString.match(/d=(\d+)x(\d+)/);

    //if there is no dimension attribute, just pass the request
    if(!dimensionMatch){
        callback(null, request);
        return;
    }

    console.log("config %j",config);
    //set the S3 and API GW endpoints
    const BUCKET = config.image_bucket;
    const APIGW_URL = config.apigw_url+"?key=";
    const HOSTNAME = config.image_bucket_url.replace("http://","");

    console.log("Bucket :%s",BUCKET);
    console.log("Hostname :%s",HOSTNAME);

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
                    console.log("Required image :%s",key);
                    /*
                    parse the prefix, width, height and image name
                    //Ex: key=images/200x200/webp/image.jpg
                    */
                    let prefix,originalKey,match,width,height,requiredFormat,imageName;
                    let startIndex;

                    try {
                      match = key.match(/(.*)\/(\d+)x(\d+)\/(.*)\/(.*)/);
                      prefix = match[1];
                      width = parseInt(match[2],10);
                      height = parseInt(match[3],10);
                      requiredFormat = match[4] == "jpg"?"jpeg":match[4];//correction for jpg required for 'Sharp'
                      imageName = match[5];
                      originalKey = prefix+"/"+imageName;
                    }
                    catch(err){
                      //no prefix exist for image..
                      console.log("no prefix present..");
                      match = key.match(/(\d+)x(\d+)\/(.*)\/(.*)/);
                      width = parseInt(match[1],10);
                      height = parseInt(match[2],10);
                      requiredFormat = match[3] == "jpg"?"jpeg":match[3];//correction for jpg required for 'Sharp'
                      imageName = match[4];
                      originalKey = imageName;
                    }

                    console.log("Path prefix :%s",prefix);
                    console.log("original key :%s",originalKey);
                    console.log("requiredFormat :%s",requiredFormat);
                    console.log("Width - Height: %d - %d",width,height);

                    //get the source image file
                    S3.getObject({Bucket: BUCKET, Key: originalKey}).promise()
                      //perform the resize operation
                      .then(data => Sharp(data.Body)
                        .resize(width, height)
                        .toFormat(requiredFormat)
                        .toBuffer()
                      )
                      .then(buffer => {
                        //save the resized object to S3 bucket with appropriate object key.
                        S3.putObject({
                          Body: buffer,
                          Bucket: BUCKET,
                          ContentType: 'image/'+requiredFormat,
                          CacheControl: 'max-age=86400',
                          Key: key,
                          StorageClass: 'REDUCED_REDUNDANCY'
                        }).promise();
                        //return a success message
                        callback(null, request);
                        // callback(null,
                        //   {
                        //     status: '200',
                        //     body: buffer
                        // });
                      })
                      .catch(err => {
                        try {
                            let match = key.match(/(.*)\/(\d+)x(\d+)\/(.*)\/(.*)/);
                            request.uri = match[1]+"/"+match[5];
                          }
                          catch(err){
                            //no prefix exist for image..
                            let match = key.match(/(\d+)x(\d+)\/(.*)\/(.*)/);
                            request.uri = "/"+match[4];
                          }

                          callback(null, request);
                      });
                }
                else{
                    //allow the request to pass through for CloudFront to fetch the image from bucket
                    callback(null, request);
                }
            });
};
