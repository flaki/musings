#!/bin/sh
docker build . -t musings

# Sync sources, generate assets (build) && push media up to S3
docker run -it -u 1000:1000 \
    -v "$(pwd)"/data:/blog/data \
    -v "$(pwd)"/data/sources:/blog/data/sources \
    --env-file .env \
    -e DEBUG=1 \
    musings

if [ $? -ne 0 ]; then exit $?; fi

docker run -it -u 1000:1000 \
    -v "$(pwd)"/data/www:/usr/share/nginx/html:ro \
    -p 8080:8080 \
    nginxinc/nginx-unprivileged:stable-alpine
