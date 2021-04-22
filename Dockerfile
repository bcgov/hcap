# Client
FROM node:14-alpine AS client

# Override API URL
ARG API_URL=""

# Build client
RUN apk add --no-cache git python g++ make
WORKDIR /client
COPY client/package*.json ./
RUN npm set progress=false && npm ci --no-cache
COPY client/. .
RUN INLINE_RUNTIME_CHUNK=false REACT_APP_API_URL="$API_URL" npm run build

# Server
FROM node:14-alpine AS server

# Static env vars
ARG VERSION
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
