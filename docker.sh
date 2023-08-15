#!/bin/sh
docker build . -t musings

docker run -it -u 1000:1000 \
    -v "$(pwd)"/data/img:/blog/img \
    -v "$(pwd)"/data/items:/blog/items \
    -v "$(pwd)"/data/sources:/blog/sources \
    -v "$(pwd)"/data/www:/blog/_site \
    -e DEBUG=1 \
    musings

docker run -it -u 1000:1000 \
    -v "$(pwd)"/data/img:/blog/img:ro \
    -v "$(pwd)"/data/www:/usr/share/nginx/html:ro \
    -p 8080:8080 \
    nginxinc/nginx-unprivileged:stable-alpine
