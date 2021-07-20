# Client
FROM registry.access.redhat.com/ubi8/nodejs-14:1 AS client

# Build client
# RUN apk add --no-cache git python g++ make
WORKDIR /opt/app-root/src/app/client
COPY client/package*.json ./
RUN npm set progress=false && npm ci --no-cache
COPY client/. .
RUN INLINE_RUNTIME_CHUNK=false npm run build

# Server
FROM registry.access.redhat.com/ubi8/nodejs-14:1 AS server

# Static env vars
ARG VERSION
ENV VERSION $VERSION
ENV NODE_ENV production

# Configure server
# RUN apk add --no-cache git
COPY --from=client /opt/app-root/src/app/client/build /opt/app-root/src/app/client/build/.
WORKDIR /opt/app-root/src/app/server
COPY server/package*.json ./
RUN npm set progress=false && npm ci --no-cache
COPY server/. .

# Run app
EXPOSE 8080
CMD [ "npm", "run", "start" ]
