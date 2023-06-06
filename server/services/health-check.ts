import { dbClient, collections } from '../db';
import logger from '../logger';

// Script method
export const healthCheck = async () => {
  let db = false;
  try {
    // eslint-disable-next-line no-unused-vars, @typescript-eslint/no-unused-vars
    const _ = await dbClient.db[collections.EMPLOYER_SITES].count();
    db = true;
  } catch (excp) {
    logger.error('DB Health Check Failed!', {
      context: 'health-check-db',
      error: excp,
    });
  }

  // Removing for now - the Keycloak health check may not be necessary for the probes
  // try {
  //   await keycloak.checkHealth();
  //   kc = true;
  // } catch (excp) {
  //   logger.error('KC Health Check Failed!', {
  //     context: 'health-check-kc',
  //     error: excp,
  //   });
  // }

  return {
    healthCheck: {
      postgres: db,
    },
    version: process.env.VERSION,
  };
};
