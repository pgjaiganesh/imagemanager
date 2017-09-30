FROM amazonlinux

WORKDIR /tmp

RUN touch ~/.bashrc && chmod +x ~/.bashrc && yum install findutils -y

RUN curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.5/install.sh | bash

RUN source ~/.bashrc && nvm install 6.10

#RUN yum -y install gcc-c++ && \
#    curl -O https://nodejs.org/download/release/v6.10.0/node-v6.10.0.tar.gz && \
#    tar -xf node-v6.10.0.tar.gz && rm -rf node-v6.10.0.tar.gz && \
#    cd node-v6.10.0 && ${PWD}/configure && make && make install

WORKDIR /build
