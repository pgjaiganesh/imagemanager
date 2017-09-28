'use strict';
//defines the allowed dimensions, default dimensions and how much variance from allowed
//dimension is allowed.

  const variables = {
        allowedDimension : [ {w:100,h:100}, {w:200,h:200}, {w:300,h:300}, {w:400,h:400} ],
        defaultDimension : {w:200,h:200},
        variance: 20,
        webpExtension: 'webp'
  };

exports.handler = (event, context, callback) => {
    const request = event.Records[0].cf.request;
    const headers = request.headers;
    let fwdUri = request.uri;
    console.log("Incoming uri %s",fwdUri);
    //assuming image path is /images/widthxheight/image-name
    const match = fwdUri.match(/(.*)\/(\d+)x(\d+)\/(.*)\.(.*)/);
    //older with query parameter (.*)\/(\d+)x(\d+)\/(.*)\.(.*)\?(.*)
    const prefix = match[1];
    let width = match[2];
    let height = match[3];
    let imageName = match[4];
    const extension = match[5];
    //const queryParameters = match[6];

    console.log("%s %d %d %s #prefix",prefix,width,height,imageName);
    let matchFound = false;
    let variancePercent = (variables.variance/100);

    for (var dimension of variables.allowedDimension) {
        //console.log(dimension);
        //compute allowed variance of dimension
        let minWidth = dimension.w - (dimension.w * variancePercent);
        let maxWidth = dimension.w + (dimension.w * variancePercent);
        console.log("deviance :%d to %d - %d",minWidth,maxWidth, width);
        if(width >= minWidth && width <= maxWidth){
            width = dimension.w;
            height = dimension.h;
            matchFound = true;
            //if it matches a predined dimension set width and height variable
            //to allowed dimension and break
            break;
        }
    }
    //set to default requested dimension do not match allowed dimension within variance.
    if(!matchFound){
        width = variables.defaultDimension.w;
        height = variables.defaultDimension.h;
    }

    console.log("width x height : %d x %d", width,height);
    //read headers to be used
    var accept = headers['accept']?headers['accept'][0].value:"";

    console.log(accept);
    console.log(ua);
    //act only for /images/ path
    if (request.uri.includes('images') !== true) {
        // do not process if this is not an image request
        callback(null, request);
    } else {
            //construct a new URL
            var url = [];
            url.push(prefix);url.push(width+"x"+height);
            //if viewer supports webP format then override, else use incoming format
            if (accept.indexOf(variables.webpExtension) >= 0) {
                 url.push(variables.webpExtension);
            }
            else{
                url.push(extension);
            }
            url.push(imageName+"."+extension);

        console.log("Final url :%s",url.join("/"));
        request.uri = url.join("/");
        callback(null, request);
    }
}
