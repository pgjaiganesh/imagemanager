'use strict';

const querystring = require('querystring');

// defines the allowed dimensions, default dimensions and how much variance from allowed
// dimension is allowed.

  const variables = {
        allowedDimension : [ {w:100,h:100}, {w:200,h:200}, {w:300,h:300}, {w:400,h:400} ],
        defaultDimension : {w:200,h:200},
        variance: 20,
        webpExtension: 'webp'
  };

exports.handler = (event, context, callback) => {
    const request = event.Records[0].cf.request;
    const headers = request.headers;

    // parse the querystrings key-value pairs. In our case it would be d=100x100
    const params = querystring.parse(request.querystring);

    // fetch the uri of original image
    let fwdUri = request.uri;

    console.log("Request : %j",request);
    console.log("Incoming uri %s",fwdUri);
    console.log("Query String %s",request.querystring);

    // if there is no dimension attribute, just pass the request
    if(!params.d){
        callback(null, request);
        return;
    }
    // read the dimension parameter value = width x height and split it by 'x'
    const dimensionMatch = params.d.split("x");

    console.log("dimension match %s",dimensionMatch);
    // set the width and height parameters
    let width = dimensionMatch[1];
    let height = dimensionMatch[2];

    // parse the prefix, image name and extension from the uri.
    // In our case /images/image.jpg

    const match = fwdUri.match(/(.*)\/(.*)\.(.*)/);

    let prefix = match[1];
    let imageName = match[2];
    let extension = match[3];

    console.log("All parsed values : %s %d %d %s",prefix,width,height,imageName);
    // define variable to be set to true if requested dimension is allowed.
    let matchFound = false;

    // calculate the acceptable variance. If image dimension is 105 and acceptable,
    // then in our case, the dimension would be corrected to 100.
    let variancePercent = (variables.variance/100);

    for (let dimension of variables.allowedDimension) {
        let minWidth = dimension.w - (dimension.w * variancePercent);
        let maxWidth = dimension.w + (dimension.w * variancePercent);
        console.log("deviance :%d to %d - %d",minWidth,maxWidth, width);
        if(width >= minWidth && width <= maxWidth){
            width = dimension.w;
            height = dimension.h;
            matchFound = true;
            break;
        }
    }
    // if no match is found from allowed dimension with variance then set to default dimensions.
    if(!matchFound){
        width = variables.defaultDimension.w;
        height = variables.defaultDimension.h;
    }

    console.log("width x height : %d x %d", width,height);

    // read the accept header to determine if webP is supported.
    let accept = headers['accept']?headers['accept'][0].value:"";

    console.log(accept);

    // check support for webp
    let url = [];
    // build the new uri to be forwarded upstream
    url.push(prefix);
    url.push(width+"x"+height);

    if (accept.includes(variables.webpExtension)) {
        url.push(variables.webpExtension);
    }
    else{
        url.push(extension);
    }
    url.push(imageName+"."+extension);

    fwdUri = url.join("/");

    // final rewriting url is of format /images/200x200/webp/image.jpg
    request.uri = fwdUri;
    callback(null, request);
}
