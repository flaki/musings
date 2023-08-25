#!/bin/sh
docker build . -t musings

# Sync sources, generate assets (build) && push media up to S3
docker run -it -u 1000:1000 \
    -v "$(pwd)"/data:/blog/data:rw \
    -v "$(pwd)"/data/sources:/blog/data/sources:rw \
    --env-file .env \
    -e DEBUG=1 \
    musings

if [ $? -ne 0 ]; then exit $?; fi

docker run -it -u 1000:1000 \
    -v "$(pwd)"/data/www:/blog/data/www:ro \
    -v "$(pwd)"/config/nginx/musings.conf:/etc/nginx/conf.d/default.conf:ro \
    -p 8080:8080 \
    nginxinc/nginx-unprivileged:stable-alpine
