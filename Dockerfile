FROM amazonlinux

WORKDIR /tmp

RUN yum -y install gcc-c++ && \
    curl -O https://nodejs.org/download/release/v6.10.0/node-v6.10.0.tar.gz && \
    tar -xf node-v6.10.0.tar.gz && rm -rf node-v6.10.0.tar.gz && \
    cd node-v6.10.0 && ${PWD}/configure && make && make install

WORKDIR /build
