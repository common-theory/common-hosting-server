FROM alpine:latest
MAINTAINER Chance Hudson

RUN apk add --no-cache nodejs-npm git python make g++ && \
  mkdir /src

COPY . /src
WORKDIR /src
RUN npm i npm@latest -g && npm ci && npm run build

# For some reason websocket is needed
# TODO: Move this to package.json? Find the origin
RUN npm install websocket

FROM alpine:latest

RUN apk add --no-cache nodejs
COPY --from=0 /src /src
WORKDIR /src

CMD ["node", "build"]
