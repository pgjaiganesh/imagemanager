'use strict';

const AWS = require('aws-sdk');
const S3 = new AWS.S3({
  signatureVersion: 'v4',
});
const Sharp = require('sharp');

const BUCKET = process.env.BUCKET;

exports.handler = function(event, context, callback) {
  const key = event.queryStringParameters.key;
  /*
  parse the prefix, width, height and image name
  //Ex: key=images/200x200/webp/image.jpg
  */
  const match = key.match(/(.*)\/(\d+)x(\d+)\/(.*)\/(.*)/);
  const prefix = match[1];
  const width = parseInt(match[2],10);
  const height = parseInt(match[3],10);
  const requiredFormat = match[4] == "jpg"?"jpeg":match[4];//correction for jpg required for 'Sharp'
  const imageName = match[5];
  const originalKey = prefix+"/"+imageName;

  console.log("original key :%s",originalKey);
  console.log("requiredFormat :%s",requiredFormat);
  console.log("Width - Height: %d - %d",width,height);
  console.log("Path prefix :%s",prefix);

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
      }).promise();
      //return a success message
      callback(null, {
        statusCode: 200,
        headers: {'ContentLength': '2'},
        body: "ok",
      });
    })
    .catch(err => callback(null, {
      statusCode: 503,
      headers: {'ContentLength': '2'},
      body: "no",
    }))
}
