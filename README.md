# imagemanager


Installation steps

To get Docker running on the AWS AMI you should follow the steps below (these are all assuming you have ssh'd on to the EC2 instance).

Update the packages on your instance

[ec2-user ~]$ sudo yum update -y
Install Docker

[ec2-user ~]$ sudo yum install docker -y
Start the Docker Service

[ec2-user ~]$ sudo service docker start
Add the ec2-user to the docker group so you can execute Docker commands without using sudo.

[ec2-user ~]$ sudo usermod -a -G docker ec2-user
You should then be able to run all of the docker commands without requiring sudo. After running the 4th command I did need to logout and log back in for the change to take effect.

[ec2-user ~]$ sudo yum install docker -y
Install git

git clone https://github.com/pgjaiganesh/imagemanager/

cd imagemanager

make all

./bin/deploy
./bin/deploy1
./bin/deploy2
