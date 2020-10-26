/* eslint-disable */
const { dbClient } = require('../db/db.js');
const { collections } = require('../db/schema.js');
const { format } = require('fast-csv');
require('dotenv').config({ path: '../.env' });

/* eslint-disable no-console */
(async () => {
  if (require.main === module) {
    try {
      await dbClient.connect();
      const db = await dbClient.db[collections.EMPLOYER_FORMS];
      const results = await db.find({});
      
      console.log(results);

      return process.exit();
    } catch (error) {
      console.error(`Failed to retrieve stats, ${error}`);
    }
  }
})();
/* eslint-enable no-console */