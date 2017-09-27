.PHONY: all image package dist resize ef cf clean

all: package

image:
	docker build --tag amazonlinux:nodejs .

package: image
	docker run --rm --volume ${PWD}/lambda:/build amazonlinux:nodejs npm install --prefix resize-function --only=prod
	docker run --rm --volume ${PWD}/lambda:/build amazonlinux:nodejs npm install --prefix viewer-request-function --only=prod
	docker run --rm --volume ${PWD}/lambda:/build amazonlinux:nodejs npm install --prefix origin-request-function --only=prod

dist: package
	mkdir -p dist && cd lambda/resize-function && zip -FS -q -r ../../dist/resize-function.zip *
	mkdir -p dist && cd lambda/viewer-request-function && zip -FS -q -r ../../dist/viewer-request-function.zip *
	mkdir -p dist && cd lambda/origin-request-function && zip -FS -q -r ../../dist/origin-request-function.zip *

resize:
	./bin/deploy

ef:
	./bin/deploy1

cf:
	./bin/deploy2

clean:
	rm -r lambda/resize-function/node_modules
	rm -r lambda/viewer-request-function/node_modules
	rm -r lambda/origin-request-function/node_modules
	docker rmi --force amazonlinux:nodejs
