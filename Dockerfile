ARG BUILD_FROM
FROM $BUILD_FROM

# Install requirements for add-on
RUN apk add --update nodejs npm
#RUN mkdir -p /usr/src/app
#WORKDIR /usr/src/app

COPY . /
COPY run.sh /

RUN npm install

RUN chmod a+x /run.sh

CMD [ "/run.sh" ]