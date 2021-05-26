/* eslint-disable no-console */
require('dotenv').config({ path: '../.env' });
const path = require('path');
const fs = require('fs');
const { dbClient } = require('../db');

const { parseAndSaveParticipants } = require('../services/participants');

const errorStyle = '\x1b[31m\x1b[40m\x1b[4m\x1b[1m'; // https://stackoverflow.com/a/41407246

(async () => {
  if (require.main === module) {
    if (!process.argv[2]) {
      console.error(`${errorStyle}Error: Input sheet filename required.`);
      process.exit(0);
    }

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
