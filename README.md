# Image Manager Setup

## Description

Ever been in a situation where you have tons of images and you want to create new dimensions, watermark them for an upcoming new design layout or you want to optimize image formats based on browser support.
What if we could just create these dimensions on the fly as needed without having to preprocess them using AWS Lambda@Edge? You can save bandwidth and better user experience.

Now with AWS Lambda@Edge along with AWS Lambda@Edge, Amazon CloudFront, Amazon API Gateway, Amazon S3 we can resize images, generate appropriate formats (webP) on the fly. For a given image URL, AWS Lambda@Edge allows for URL manipulation, checks whether the object exists on S3. Further if the object does not exist it invokes the resize function via Amazon API Gateway and stores the resized image on S3.
Subsequent requests are just served directly from S3.

## Usage

1. Build the Resize Lambda function under `lambda/resize-function`

    The image resize function uses [sharp][sharp] module which needs the [libvips][libvips] native extensions. The Lambda code along with dependencies must be build and packaged in Amazon Linux environment. We will use a Docker container to build the packages locally. The Makefile is configured to donwload Amazon Linux, install Node.js 6.10 and build the code. Execute `make all`. This command takes a while to complete.

To setup environment on Amazon Linux EC2 instance

Update the packages on your instance
[ec2-user ~]$ sudo yum update -y

Install Docker
[ec2-user ~]$ sudo yum install docker -y

Start the Docker Service
[ec2-user ~]$ sudo service docker start

Add the ec2-user to the docker group so you can execute Docker commands without using sudo.
[ec2-user ~]$ sudo usermod -a -G docker ec2-user

You should then be able to run all of the docker commands without requiring sudo. You should logout and log  in back for the change to take effect.

Install git
[ec2-user ~]$ sudo yum install git -y

Clone the repo
git clone https://github.com/pgjaiganesh/imagemanager/

Change directory to repository created
cd imagemanager

Initial build AmazonLinux with Node.js6.10 and build functions.
Takes a while for the build to complete
make all

Whenever you make changes to the lambda code, this command builds them in the amazonlinux:nodejs6.10
environment and packages as zip file into the ./dist folder
- make dist

Packages and deploys the CloudFormation template (cloudformation/image-resize.yaml) for API Gateway and AWS Lambda function at 'dist/resize-function.zip'. The deployed region can be configured in $deployment_region in '/bin/config' script.
- make resize

Packages and deploys the CloudFormation template (cloudformation/edge-functions.yaml) for the two Lambda@Edge functions to handle 'Viewer-Request' and 'Origin-Request' Amazon CloudFront events. Also generates the config.js and packages into 'dist/origin-request-function.zip'. Always deploys into us-east-1 as required by Lambda@Edge.
- make ef

Creates CloudFront distribution with custom origin as S3 website url created in ./bin/deploy,
creates lambda edge function versions and associates them to the distribution
- make cf
