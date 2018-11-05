FROM alpine:latest
MAINTAINER Chance Hudson

RUN apk add --no-cache nodejs-npm git python make g++ && \
  mkdir /src

COPY . /src

RUN cd /src && \
  npm install && \
  npm run build

FROM alpine:latest

RUN apk add --no-cache nodejs
COPY --from=0 /src /src

CMD ["node", "/src/build"]
