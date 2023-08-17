#!/bin/sh
docker build . -t musings

# note: need to mount `data/sources` separately if it is symlinked
docker run -it -u 1000:1000 \
    -v "$(pwd)"/data:/blog/data \
    -v "$(pwd)"/data/sources:/blog/data/sources \
    -e DEBUG=1 \
    musings

if [ $? ge 0 ]; then exit $?; fi

docker run -it -u 1000:1000 \
    -v "$(pwd)"/data/www:/usr/share/nginx/html:ro \
    -p 8080:8080 \
    nginxinc/nginx-unprivileged:stable-alpine
