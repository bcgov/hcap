# Client
FROM registry.access.redhat.com/ubi8/nodejs-18:1 AS client

# Build client
ENV HOME_CLIENT /opt/app-root/src/app/client
# Using root to transfer ownership of work dir
USER root
RUN mkdir -p ${HOME_CLIENT}
RUN chown -R 1008111001 ${HOME_CLIENT}
WORKDIR ${HOME_CLIENT}
COPY client/package*.json ./
RUN chown -R 1008111001 .
USER 1008111001
RUN npm set progress=false && npm ci --no-cache
COPY client/. .
RUN INLINE_RUNTIME_CHUNK=false npm run build

# Server
FROM registry.access.redhat.com/ubi8/nodejs-18:1 AS server
# Static env vars
ARG VERSION
ENV VERSION $VERSION
ENV NODE_ENV production
ENV HOME_SERVER /opt/app-root/src/app/server
ENV HOME_CLIENT /opt/app-root/src/app/client

# Configure server
# Using root to transfer ownership of work dir
USER root
RUN mkdir -p ${HOME_SERVER}
RUN mkdir -p ${HOME_CLIENT}
RUN chown -R 1001 ${HOME_CLIENT}
RUN chown -R 1001 ${HOME_SERVER}
COPY --from=client /opt/app-root/src/app/client/build /opt/app-root/src/app/client/build/.
RUN chmod 777 "/opt/app-root/src/.npm"

USER 1001
WORKDIR ${HOME_SERVER}
COPY server/package*.json ./
RUN npm set progress=false && npm ci --no-cache
RUN chown -R root:0 "/opt/app-root/src/.npm"
COPY server/. .
# Run app
EXPOSE 8080
CMD [ "npm", "run", "start" ]
