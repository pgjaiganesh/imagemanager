# Image Manager

## Use case

Ever been in a situation where you have tons of images and you want to create new dimensions, watermark them for an upcoming new design layout or you want to optimize image formats based on browser support.
What if we could just create these dimensions on the fly as needed without having to preprocess them using AWS Lambda@Edge? You can save bandwidth and better user experience.

Now with AWS Lambda@Edge along with AWS Lambda@Edge, Amazon CloudFront, Amazon API Gateway, Amazon S3 we can resize images, generate appropriate formats (webP) on the fly. For a given image URL, AWS Lambda@Edge allows for URL manipulation, checks whether the object exists on S3. Further if the object does not exist it invokes the resize function via Amazon API Gateway and stores the resized image on S3.
Subsequent requests are just served directly from S3.

## Setup

1. Build the environment.

    The image resize function uses [sharp][sharp] module which needs the `libvips` native extensions. The Lambda code along with dependencies must be build and packaged in Amazon Linux environment.

    We will use a Docker container to build the packages locally. The Dockerfile is configured to download [Amazon Linux][amazon-linux], install Node.js 6.10.

    (If you do not want to use Dockers then follow [additional-notes] to see on how to setup environment and then follow the same sequence outlined below)

    Install the latest version of [AWS CLI][cli] used for deployment.

1. Execute `make all`. This command takes a while to complete.

1.  Execute `make dist` whenever you make changes to the lambda code, this command builds them in the correct environment build above. The packaged zip files are stored inside `dist` folder
    - ./dist/resize-function.zip - contains the Image Resize Lambda function
    - ./dist/Viewer-Request-function.zip - contains Lambda@Edge code for 'Viewer-Request' event.
    - ./dist/origin-request-function.zip - contains Lambda@Edge code for 'Origin-Request' event.

1.  Execute `make resize` to packages and deploy the CloudFormation template `cloudformation/image-resize.yaml` which defines the API Gateway and AWS Lambda function for Image resize.
The deployed region can be configured in `$deployment_region` variable in `bin/config` script.

1.  Execute `make ef` to packages and deploys the CloudFormation template `cloudformation/edge-functions.yaml` for the two Lambda@Edge functions to handle 'Viewer-Request' and 'Origin-Request' Amazon CloudFront events. Also generates the `config.js` and packages into 'dist/origin-request-function.zip'.

**Note:** Please note to always deploy into `us-east-1` region as required by AWS Lambda@Edge.

1.  Execute `make cf` to creates CloudFront distribution with custom origin as S3 website url created in `make resize`. Further creates a new version of the AWS Lambda@Edge functions created above and associates them to the appropriate event in the configuration.

## Usage

1. Upload a high-res image file into the website bucket created.

2. Open your favorite browser and navigate to:
    https://{cloudfront-domain}/{image-name}?d=100x100
    - cloudfront-domain - is available from the distribution created in the 'make cf' step.
    - 100x100 is the desired dimension

## License

This reference architecture sample is licensed under Apache 2.0.

[amazon-linux]: https://store.docker.com/images/amazonlinux
[cli]: https://aws.amazon.com/cli/
[sharp]: https://github.com/lovell/sharp
