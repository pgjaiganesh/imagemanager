# imagemanager

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
- ./bin/deploy

Packages and deploys the CloudFormation template (cloudformation/edge-functions.yaml) for the two Lambda@Edge functions to handle 'Viewer-Request' and 'Origin-Request' Amazon CloudFront events. Also generates the config.js and packages into 'dist/origin-request-function.zip'. Always deploys into us-east-1 as required by Lambda@Edge.
- ./bin/deploy1

Creates CloudFront distribution with custom origin as S3 website url created in ./bin/deploy,
creates lambda edge function versions and associates them to the distribution
- ./bin/deploy2
