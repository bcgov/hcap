/* eslint-disable no-console */
require('dotenv').config({ path: '../.env' });
const { dbClient } = require('../db/db.js');
const { getParticipantsReport } = require('../services/reporting');

(async () => {
  if (require.main === module) {
    try {
      await dbClient.connect();

      const results = await getParticipantsReport();

      console.log(results);

      return process.exit();
    } catch (error) {
      console.error(`Failed to retrieve participant stats, ${error}`);
    }
  }
  return null;
})();
