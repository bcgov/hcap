# Client
FROM registry.hub.docker.com/library/node:14-alpine AS client

# Build client
RUN apk add --no-cache git python g++ make
WORKDIR /client
COPY client/package*.json ./
RUN npm set progress=false && npm ci --no-cache
COPY client/. .
RUN INLINE_RUNTIME_CHUNK=false npm run build

# Server
FROM registry.hub.docker.com/library/node:14-alpine AS server

# Static env vars
ARG VERSION_ABC
ENV VERSION $VERSION
ENV NODE_ENV production

# Configure server
RUN apk add --no-cache git
COPY --from=client /client/build /client/build/.
WORKDIR /server
COPY server/package*.json ./
RUN npm set progress=false && npm ci --no-cache
COPY server/. .

# Run app
EXPOSE 8080
CMD [ "npm", "run", "start" ]
