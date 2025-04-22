# Client
FROM node:20-slim AS client

# Build client
ENV HOME_CLIENT=/opt/app-root/src/app/client
# Using root to transfer ownership of work dir
USER root

# Set npm configuration to use directories the user can write to
ENV npm_config_cache=/tmp/.npm
ENV npm_config_userconfig=/tmp/.npmrc
ENV HOME=/tmp

# Create directories and set permissions
RUN mkdir -p ${HOME_CLIENT} \
    && mkdir -p ${npm_config_cache} \
    && touch ${npm_config_userconfig} \
    && chmod -R 777 ${npm_config_cache} \
    && chmod 777 ${npm_config_userconfig} \
    && chown -R 1008111001 ${HOME_CLIENT}

WORKDIR ${HOME_CLIENT}
COPY client/package*.json ./
RUN chown -R 1008040000 .

USER 1008040000
# Use --no-update-notifier to avoid npm trying to write to the home directory
RUN npm set progress=false --userconfig ${npm_config_userconfig} \
    && npm ci --no-cache --no-update-notifier
COPY client/. .
RUN INLINE_RUNTIME_CHUNK=false npm run build

# Server build stage
FROM node:20-slim AS server-builder
ENV HOME_SERVER=/opt/app-root/src/app/server
USER root

# Set npm configuration for server build
ENV npm_config_cache=/tmp/.npm-server
ENV npm_config_userconfig=/tmp/.npmrc-server
ENV HOME=/tmp

# Create directories and set permissions
RUN mkdir -p ${HOME_SERVER} \
    && mkdir -p ${npm_config_cache} \
    && touch ${npm_config_userconfig} \
    && chmod -R 777 ${npm_config_cache} \
    && chmod 777 ${npm_config_userconfig}

WORKDIR ${HOME_SERVER}
COPY server/package*.json ./
RUN npm set progress=false --userconfig ${npm_config_userconfig} \
    && npm ci --no-cache --no-update-notifier
COPY server/. .
# Build TypeScript to JavaScript
RUN npm run build

# Server runtime stage
FROM node:20-slim AS server
# Static env vars
ARG VERSION
ENV VERSION=$VERSION
ENV NODE_ENV=production
ENV HOME_SERVER=/opt/app-root/src/app/server
ENV HOME_CLIENT=/opt/app-root/src/app/client

# Configure server
# Using root to transfer ownership of work dir
USER root

# Set npm configuration for server runtime
ENV npm_config_cache=/tmp/.npm-runtime
ENV npm_config_userconfig=/tmp/.npmrc-runtime
ENV HOME=/tmp

RUN mkdir -p ${HOME_SERVER} \
    && mkdir -p ${HOME_CLIENT} \
    && mkdir -p ${npm_config_cache} \
    && touch ${npm_config_userconfig} \
    && chmod -R 777 ${npm_config_cache} \
    && chmod 777 ${npm_config_userconfig} \
    && chown -R 1001 ${HOME_CLIENT} \
    && chown -R 1001 ${HOME_SERVER}

COPY --from=client /opt/app-root/src/app/client/build /opt/app-root/src/app/client/build/.

WORKDIR ${HOME_SERVER}
COPY server/package*.json ./
# Install only production dependencies
RUN npm set progress=false --userconfig ${npm_config_userconfig} \
    && npm ci --only=production --no-update-notifier

# Set permissions for the user that will run the application
RUN chown -R 1001:0 ${HOME_SERVER} \
    && chmod -R g=u ${HOME_SERVER}

USER 1001

# Copy compiled JavaScript from builder stage
COPY --from=server-builder /opt/app-root/src/app/server/build ./build
# Copy any non-TypeScript files needed at runtime
COPY server/migrations ./migrations
COPY server/scripts ./scripts
COPY server/test-data ./test-data
# Add any other directories with non-TypeScript files that are needed at runtime

# Run app
EXPOSE 8080
# Use the compiled JavaScript with the existing start:prod script
CMD [ "npm", "run", "start:prod" ]