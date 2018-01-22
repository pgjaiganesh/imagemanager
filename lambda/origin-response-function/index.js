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

exports.handler = (event, context, callback) => {
  let response = event.Records[0].cf.response;

  console.log("Response status code :%s", response.status);

  //check if image is not present
  if (response.status == 404) {

    let request = event.Records[0].cf.request;
    let params = querystring.parse(request.querystring);

    console.log("Request :%j", request);

    // if there is no dimension attribute, just pass the response
    if (!params.d) {
      callback(null, response);
      return;
    }

    // read the dimension parameter value = width x height and split it by 'x'
    let dimensionMatch = params.d.split("x");


    console.log("Bucket :%s", BUCKET);
    console.log("Time remaining1 :%s", context.getRemainingTimeInMillis());

    // read the required path. Ex: uri /images/100x100/webp/image.jpg
    let path = request.uri;
    console.log("url :%s", path);

    // read the S3 key from the path vaiable.
    // Ex: path variable /images/100x100/webp/image.jpg
    let key = path.substring(1);
    console.log("Required image :%s", key);

    // parse the prefix, width, height and image name
    // Ex: key=images/200x200/webp/image.jpg
    let prefix, originalKey, match, width, height, requiredFormat, imageName;
    let startIndex;

    try {
      match = key.match(/(.*)\/(\d+)x(\d+)\/(.*)\/(.*)/);
      prefix = match[1];
      width = parseInt(match[2], 10);
      height = parseInt(match[3], 10);

      //correction for jpg required for 'Sharp'
      requiredFormat = match[4] == "jpg" ? "jpeg" : match[4];
      imageName = match[5];
      originalKey = prefix + "/" + imageName;
    }
    catch (err) {
      // no prefix exist for image..
      console.log("no prefix present..");
      match = key.match(/(\d+)x(\d+)\/(.*)\/(.*)/);
      width = parseInt(match[1], 10);
      height = parseInt(match[2], 10);

      //correction for jpg required for 'Sharp'
      requiredFormat = match[3] == "jpg" ? "jpeg" : match[3];
      imageName = match[4];
      originalKey = imageName;
    }

    console.log("Path prefix :%s", prefix);
    console.log("original key :%s", originalKey);
    console.log("requiredFormat :%s", requiredFormat);
    console.log("Width - Height: %d - %d", width, height);

    // get the source image file
    S3.getObject({ Bucket: BUCKET, Key: originalKey }).promise()
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
            ContentType: 'image/' + requiredFormat,
            CacheControl: 'max-age=31536000',
            Key: key,
            StorageClass: 'REDUCED_REDUNDANCY'
        }).promise()
        // even if there is exception in saving the object back we send the generated
        // image back to viewer below
        .catch(() => { console.log("Exception while writing resized image to bucket")});

        // generate a binary response with resize image
        response.status = 200;
        response.body = buffer.toString('base64');
        response.bodyEncoding = 'base64';
        response.headers['content-type'] = [{ key: 'Content-Type', value: 'image/' + requiredFormat }];
        console.log("Response generated :%j", response);
        callback(null, response);
      })
    .catch( err => {
      console.log("Exception while reading original image :%j",err);
    });
  } // end of if block checking response statusCode
  else {
    // allow the response to pass through for CloudFront to fetch the image from bucket
    callback(null, response);
  }
};
