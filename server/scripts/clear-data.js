/* eslint-disable no-console */
require('dotenv').config({ path: '../.env' });
const { dbClient } = require('../db');
const { databaseCollections } = require('../db/schema');

(async () => {
  if (process.env.APP_ENV === 'prod') {
    console.error('Cannot clear data on production');
    return;
  }
  if (require.main === module) {
    try {
      await dbClient.connect();
      await dbClient.runRawQuery(
        `truncate ${[Object.values(databaseCollections).join(',')]} RESTART IDENTITY;`
      );
      await dbClient.disconnect();
      process.exit(0);
    } catch (err) {
      console.error('Failed to truncate tables', err);
      process.exit(1);
    }
  }
})();
