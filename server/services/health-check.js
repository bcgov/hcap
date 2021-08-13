const { dbClient, collections } = require('../db');
const keycloak = require('../keycloak');
const logger = require('../logger');

// Script method
const healthCheck = async () => {
  let db = false;
  let kc = false;
  try {
    // eslint-disable-next-line no-unused-vars
    const _ = await dbClient.db[collections.EMPLOYER_SITES].count();
    db = true;
  } catch (excp) {
    logger.error('DB Health Check Failed!', {
      context: 'health-check-db',
      error: excp,
    });
  }

  try {
    await keycloak.authenticateIfNeeded();
    kc = true;
  } catch (excp) {
    logger.error('KC Health Check Failed!', {
      context: 'health-check-kc',
      error: excp,
    });
  }

  return {
    healthCheck: {
      keycloak: kc,
      postgres: db,
    },
    version: process.env.VERSION,
  };
};

module.exports = {
  healthCheck,
};
