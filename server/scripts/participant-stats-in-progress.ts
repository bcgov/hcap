/* eslint-disable no-console */
import './load-env';
import csv from 'fast-csv';
import path from 'path';
import { writeFileSync } from 'fs';
import { dbClient } from '../db';
import { getParticipantsReport } from '../services/reporting';

(async () => {
  if (require.main === module) {
    try {
      await dbClient.connect();

      const results = await getParticipantsReport();

      const csvStream = csv.format({ headers: true });

      results.forEach((result) => {
        csvStream.write({
          'Participant ID': result.participantId,
          FSA: result.participantFsa,
          'Employer ID': result.employerId,
          'Employer Email': result.employerEmail,
          'Employer Health Region': result.employerhealthRegion,
        });
      });

      const chunks = [];
      csvStream
        .on('data', (chunk) => chunks.push(chunk))
        .on('error', (error) => console.log(error))
        .on('end', () => {
          const string = Buffer.concat(chunks).toString();
          writeFileSync(path.join(__dirname, 'participant-stats-in-progress.csv'), string);
          console.log('Done');
        });

      csvStream.end();
    } catch (error) {
      console.error(`Failed to retrieve participant stats, ${error}`);
    }
  }
  return null;
})();
