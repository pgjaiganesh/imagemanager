# Quick reference

- `make all`
use it for the first time to build the amazonlinux image with node.js 6.10 version.
Takes a while for the build to complete

- `make dist`
wheneven you make changes to the lambda code, this command builds them in the amazonlinux:nodejs6.10
environment and packages as zip file into the ./dist folder

- `make resize`
Packages and deploys the CloudFormation template for API Gateway and AWS Lambda function for
image resizing into the deployment region (variable specified in ./bin/config)

- `make ef`
Packages and deploys the CloudFormation template for the two Lambda Edge functions to handle
viewer-request and origin-request events. Also generates the config.js and packages into the
origin-request lambda function zip.

- `make cf`
Creates CloudFront distribution with custom origin as S3 website url created in ./bin/deploy,
creates lambda edge function versions and associates them to the distribution
