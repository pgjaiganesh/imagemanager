## To setup environment on Amazon Linux EC2 instance

1.  Update the packages on your instance  
[ec2-user ~]$ sudo yum update -y

1.  Install Docker  
[ec2-user ~]$ sudo yum install docker -y

Start the Docker Service

[ec2-user ~]$ sudo service docker start

Add the ec2-user to the docker group so you can execute Docker commands without using sudo.

[ec2-user ~]$ sudo usermod -a -G docker ec2-user

You should then be able to run all of the docker commands without requiring sudo. You should logout and log  in back for the change to take effect.

Install jq - used for parsing JSON inputs

[ec2-user ~]$ sudo yum install jq -y

Install git

[ec2-user ~]$ sudo yum install git -y

Clone the repo

git clone https://github.com/pgjaiganesh/imagemanager/

Change directory to repository created and follow instructions in 'README.md'

cd imagemanager
