/* eslint-disable no-console */
require('dotenv').config({ path: '../.env' });
const csv = require('fast-csv');
const path = require('path');
const { writeFileSync } = require('fs');
const { dbClient } = require('../db/db.js');
const { getRejectedParticipantsReport } = require('../services/reporting');

(async () => {
  if (require.main === module) {
    try {
      await dbClient.connect();

      const results = await getRejectedParticipantsReport();

      console.log('stream input');
      console.log(results);

      const csvStream = csv.format({ headers: true });

      results.forEach((result) => {
        csvStream.write({
          'Participant ID': result.participantId,
          'Employer ID': result.employerId,
          'Reason for Rejection': result.rejection.final_status,
        });
      });

      const chunks = [];
      csvStream
        .on('data', (chunk) => chunks.push(chunk))
        .on('error', (error) => console.log(error))
        .on('end', () => {
          const string = Buffer.concat(chunks).toString();
          writeFileSync(path.join(__dirname, 'participant-stats-rejected.csv'), string);
          console.log('Done');
        });

      csvStream.end();
    } catch (error) {
      console.error(`Failed to retrieve participant stats, ${error}`);
    }
  }
  return null;
})();
