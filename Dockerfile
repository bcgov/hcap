# Client
FROM public.ecr.aws/bitnami/node:14.17.3 AS client

# Build client
WORKDIR /client
COPY client/package*.json ./
RUN npm set progress=false && npm ci --no-cache
COPY client/. .
RUN INLINE_RUNTIME_CHUNK=false npm run build

# Server
FROM public.ecr.aws/bitnami/node:14.17.3 AS server

# Static env vars
ARG VERSION
ENV VERSION $VERSION
ENV NODE_ENV production

# Configure server
COPY --from=client /client/build /client/build/.
WORKDIR /server
COPY server/package*.json ./
RUN npm set progress=false && npm ci --no-cache
COPY server/. .

# Run app
EXPOSE 8080
CMD [ "npm", "run", "start" ]
