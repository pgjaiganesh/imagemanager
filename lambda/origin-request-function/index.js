'use strict';

const http = require('http');
const https = require('https');
const querystring = require('querystring');

const AWS = require('aws-sdk');
const S3 = new AWS.S3({
  signatureVersion: 'v4',
});
const Sharp = require('sharp');

// set the S3 and API GW endpoints
const BUCKET = 'image-resize-444603092185-us-east-1';
const BUCKET_WEBSITE_URL = 'image-resize-444603092185-us-east-1.s3-website-us-east-1.amazonaws.com';

exports.handler = (event, context, callback) => {
    const request = event.Records[0].cf.request;
    const params = querystring.parse(request.querystring);

    console.log("Request :%j",request);

    // read the dimension parameter value = width x height and split it by 'x'
    const dimensionMatch = params.d.split("x");

    // if there is no dimension attribute, just pass the request
    if(!dimensionMatch){
        callback(null, request);
        return;
    }

    console.log("Bucket :%s",BUCKET);
    console.log("Bucket WebsiteURL :%s",BUCKET_WEBSITE_URL);

    console.log("Time remaining1 :%s",context.getRemainingTimeInMillis());

    // read the required path. Ex: uri /images/100x100/webp/image.jpg
    let path = request.uri;
    console.log("url :%s",path);

    let options = {
        hostname: BUCKET_WEBSITE_URL,
        path: path,
        port: 80,
        method: 'HEAD'
    };

    // make a HTTP HEAD request to check for presence of the object.
    http.get(options, (res) => {
        console.log("Status code :%s",res.statusCode);
        console.log("Time remaining1.1 :%s",context.getRemainingTimeInMillis());

        res.on('data', (chunk) => {});
        res.on('end', () => {
            console.log("Made http call");
        });

        // if image does not exist initiate a resize operation via API GW
        if(res.statusCode == 404){

            // read the S3 key from the path vaiable.
            // Ex: path variable /images/100x100/webp/image.jpg
            let key = path.substring(1);
            console.log("Required image :%s",key);

            // parse the prefix, width, height and image name
            // Ex: key=images/200x200/webp/image.jpg
            let prefix, originalKey, match, width, height, requiredFormat, imageName;
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
                  // no prefix exist for image..
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

              // get the source image file
              S3.getObject({Bucket: BUCKET, Key: originalKey}).promise()
              // perform the resize operation
              .then(data => Sharp(data.Body)
                  .resize(width, height)
                  .toFormat(requiredFormat)
                  .toBuffer()
              )
              .then(buffer => {
                  // save the resized object to S3 bucket with appropriate object key.
                  S3.putObject({
                      Body: buffer,
                      Bucket: BUCKET,
                      ContentType: 'image/'+requiredFormat,
                      CacheControl: 'max-age=86400',
                      Key: key,
                      StorageClass: 'REDUCED_REDUNDANCY'
                  }).promise()
                  .then( () => {
                      // allow the request to pass through for CloudFront to fetch the image from bucket
                      console.log("Allow CF to fetch the object");
                      //callback(null,request);
                      var response = {
                          headers: {
                            'content-type': [{key:'Content-Type', value: 'image/'+requiredFormat}]
                          },
                          body: buffer.toString('base64'),
                          bodyEncoding: 'base64',
                          status: '200',
                          statusDescription: "OK"
                      }
                      console.log("Response generated :%j",response);
                      callback(null, response);
                    }
                  )
                  .catch(err => {
                      callback(null,fallback(key,request));
                  });
              })
              .catch(err => {
                  callback(null,fallback(key,request));
              });
        } // end of if block checking response statusCode
        else{
            // allow the request to pass through for CloudFront to fetch the image from bucket
            callback(null, request);
        }
    });
};

// fallback to original image when there is error in image generation.
function fallback(key, request){
  console.log("In fallback with key :%s",key);
  try {
      // if image path has prefix
      let match = key.match(/(.*)\/(\d+)x(\d+)\/(.*)\/(.*)/);
      request.uri = match[1]+"/"+match[5];
  }
  catch(err){
      // no prefix exist for image..
      let match = key.match(/(\d+)x(\d+)\/(.*)\/(.*)/);
      request.uri = "/"+match[4];
  }
  return request;
}
