/* eslint-disable no-console */
import csv from 'fast-csv';
import path from 'path';
import { writeFileSync } from 'fs';
import { dbClient } from '../db';
import { getNoOfferParticipantsReport } from '../services/reporting';

require('dotenv').config({ path: '../.env' });

(async () => {
  if (require.main === module) {
    try {
      await dbClient.connect();

      const results = await getNoOfferParticipantsReport();

      const csvStream = csv.format({ headers: true });

      results.forEach((result) => {
        csvStream.write({
          'Participant ID': result.id,
          'Participant Email': result.emailAddress,
          FSA: result.postalCodeFsa,
          Regions: result.preferredLocation,
          Interest: result.interested,
          'Date Last Updated': result.userUpdatedAt,
        });
      });

      const chunks = [];
      csvStream
        .on('data', (chunk) => chunks.push(chunk))
        .on('error', (error) => console.log(error))
        .on('end', () => {
          const string = Buffer.concat(chunks).toString();
          writeFileSync(path.join(__dirname, 'participant-stats-no-offers.csv'), string);
          console.log('Done');
        });

      csvStream.end();
    } catch (error) {
      console.error(`Failed to retrieve participant stats, ${error}`);
    }
  }
  return null;
})();
