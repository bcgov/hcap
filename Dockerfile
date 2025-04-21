# Client
FROM node:20-slim AS client

# Build client
ENV HOME_CLIENT=/opt/app-root/src/app/client
# Using root to transfer ownership of work dir
USER root
RUN mkdir -p ${HOME_CLIENT}
RUN chown -R 1008111001 ${HOME_CLIENT}
WORKDIR ${HOME_CLIENT}
COPY client/package*.json ./
RUN chown -R 1008040000 .
USER 1008040000
RUN npm set progress=false && npm ci --no-cache
COPY client/. .
RUN INLINE_RUNTIME_CHUNK=false npm run build

# Server build stage
FROM node:20-slim AS server-builder
ENV HOME_SERVER=/opt/app-root/src/app/server
USER root
RUN mkdir -p ${HOME_SERVER}
WORKDIR ${HOME_SERVER}
COPY server/package*.json ./
RUN npm set progress=false && npm ci --no-cache
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
RUN mkdir -p ${HOME_SERVER}
RUN mkdir -p ${HOME_CLIENT}
RUN chown -R 1001 ${HOME_CLIENT}
RUN chown -R 1001 ${HOME_SERVER}
COPY --from=client /opt/app-root/src/app/client/build /opt/app-root/src/app/client/build/.

WORKDIR ${HOME_SERVER}
COPY server/package*.json ./
# Install only production dependencies
RUN npm set progress=false && npm ci --only=production
RUN chown -R 1001:0 "/opt/app-root/src/.npm"
RUN chgrp -R 0 "/opt/app-root/src/.npm" && chmod -R g=u "/opt/app-root/src/.npm"
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