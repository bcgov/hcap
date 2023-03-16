import type { Server } from 'http';
import { app } from './server';
import logger from './logger';
import { dbClient } from './db';
import keycloak from './keycloak';

const port = Number(process.env.SERVER_PORT) || 8080;

let server: Server | undefined;

// shut down server
async function shutdown() {
  if (server) {
    server.close((err) => {
      if (err) {
        logger.error('shutting down server', err);
        process.exitCode = 1;
      }
      process.exit();
    });
  }
}

// quit on ctrl-c when running docker in terminal
process.on('SIGINT', () => {
  logger.info('Got SIGINT (aka ctrl-c in docker). Graceful shutdown ', new Date().toISOString());
  shutdown();
});

// quit properly on docker stop
process.on('SIGTERM', () => {
  logger.info('Got SIGTERM (docker container stop). Graceful shutdown ', new Date().toISOString());
  shutdown();
});

// Start server
(async () => {
  try {
    await dbClient.connect();
    await keycloak.buildInternalIdMap();
    const results = await dbClient.runMigration();
    results.forEach((result) => {
      logger.info(`Migration success: ${result.name}`);
    });
    server = app.listen(port, '0.0.0.0', async () => {
      logger.info(`Listening on port: ${port}`);
      logger.info(`APP ENV: ${process.env.APP_ENV}`);
    });
  } catch (err) {
    logger.error('Failed to start server!', err);
    logger.info('shutting down server');
    shutdown();
  }
})();

//
// need above in docker container to properly exit
//

module.exports = server;
