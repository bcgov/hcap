# Client
FROM node:20-slim AS client

# Build client
ENV HOME_CLIENT=/opt/app-root/src/app/client
# Using root to transfer ownership of work dir
USER root

# Set home to a writable location
ENV HOME=/tmp

RUN mkdir -p ${HOME_CLIENT}
RUN chown -R 1008111001 ${HOME_CLIENT}
WORKDIR ${HOME_CLIENT}
COPY client/package*.json ./
RUN chown -R 1008040000 .

USER 1008040000
# Use --cache /tmp/.npm directly with the npm command
RUN npm set progress=false && npm ci --cache=/tmp/.npm --no-update-notifier --ignore-scripts
COPY client/. .
RUN INLINE_RUNTIME_CHUNK=false npm run build

# Server build stage
FROM node:20-slim AS server-builder
ENV HOME_SERVER=/opt/app-root/src/app/server
USER root

# Set home to a writable location
ENV HOME=/tmp

RUN mkdir -p ${HOME_SERVER}
WORKDIR ${HOME_SERVER}
COPY server/package*.json ./
RUN npm set progress=false && npm install --cache=/tmp/.npm-server --no-update-notifier --ignore-scripts
COPY server/. .
# Build TypeScript to JavaScript
RUN npm run build

# Copy non-TypeScript assets to build directory
RUN mkdir -p build/migrations/assets && \
    cp -r migrations/assets/* build/migrations/assets/ 2>/dev/null || true

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

# Set home to a writable location
ENV HOME=/tmp

RUN mkdir -p ${HOME_SERVER}
RUN mkdir -p ${HOME_CLIENT}
RUN chown -R 1001 ${HOME_CLIENT}
RUN chown -R 1001 ${HOME_SERVER}

# Copy client build files to where the server expects them
COPY --from=client /opt/app-root/src/app/client/build /opt/app-root/src/app/server/client/build/

WORKDIR ${HOME_SERVER}
COPY server/package*.json ./
RUN npm set progress=false && npm ci --omit=dev --cache=/tmp/.npm-runtime --no-update-notifier --ignore-scripts
RUN mkdir -p /tmp/.npm
RUN chown -R 1001:0 "/tmp/.npm"
RUN chgrp -R 0 "/tmp/.npm" && chmod -R g=u "/tmp/.npm"
USER 1001

# Copy only the compiled JavaScript and assets from builder stage
COPY --from=server-builder /opt/app-root/src/app/server/build ./build
# Create a symbolic link so that /migrations points to /build/migrations
RUN ln -sf /opt/app-root/src/app/server/build/migrations /opt/app-root/src/app/server/migrations


# Run app
EXPOSE 8080
# Use the compiled JavaScript with the existing start:prod script
CMD [ "npm", "run", "start:prod" ]