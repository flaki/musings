FROM node:18-bullseye-slim AS build

# Install build-time dependencies required for image and video manipulation
RUN apt update && apt-get -y install \
    git git-lfs \
    libjpeg-turbo-progs \
    exiv2 \
    ffmpeg \
    imagemagick

# Install node-js dependencies
WORKDIR /blog
COPY --chown=1000 package*.json ./
RUN npm ci

# Mounted:

# sources
# img
# items
# _site

COPY --chown=1000 src ./src/
COPY --chown=1000 assets ./assets/
COPY --chown=1000 build.js ./

#RUN node build.js

STOPSIGNAL SIGQUIT
CMD [ "node", "build.js" ]


# maybe use nginx:alpine instead?
##FROM alpine:latest
##RUN apk add nginx bash

# Unprivileged nginx based on Alpine
# https://stackoverflow.com/a/72642450
##FROM nginxinc/nginx-unprivileged:stable-alpine

##COPY --from=build /blog/_site /var/www
##COPY --chown=1000 ./config/nginx/*.conf /etc/nginx/http.d/

# Add the WebAssembly content type to the mime types served by Nginx
##RUN grep -c wasm /etc/nginx/mime.types || sed -i "s/}/\n    # WebAssembly\n    application\/wasm    wasm;\n}/" /etc/nginx/mime.types

##EXPOSE 80
##STOPSIGNAL SIGQUIT
##CMD [ "nginx", "-g", "daemon off;" ]
