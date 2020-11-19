const app = require('./server.js');
const logger = require('./logger.js');
const { dbClient } = require('./db');

const port = process.env.SERVER_PORT || 8080;

/** @type {http.Server|undefined} */
let server;

// shut down server
async function shutdown() {
  if (server) {
    server.close((err) => {
      if (err) {
        logger.error(err);
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
    await dbClient.runMigration();
    server = app.listen(port, '0.0.0.0', async () => {
      logger.info(`Listening on port ${port}`);
    });
  } catch (err) {
    logger.error(err.message || err);
    shutdown();
  }
})();

//
// need above in docker container to properly exit
//

module.exports = server;
