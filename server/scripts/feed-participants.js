/* eslint-disable no-console */
require('dotenv').config({ path: '../.env' });
const path = require('path');
const fs = require('fs');
const { dbClient } = require('../db');

const { parseAndSaveParticipants } = require('../services/participants');

(async () => {
  if (require.main === module) {
    await dbClient.connect();
    console.log('Successfully Connected to DB');

    try {
      fs.readFile(path.resolve(__dirname, `xlsx/${process.argv[2]}`), async (err, data) => {
        if (err) {
          console.error(err);
          return;
        }

        const results = await parseAndSaveParticipants(data);

        console.table(results);
        process.exit(0);
      });
    } catch (error) {
      console.error(`Failed to feed employer sites entity, ${error}`);
    }
  }
})();
