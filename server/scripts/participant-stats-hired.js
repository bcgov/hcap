/* eslint-disable no-console */
require('dotenv').config({ path: '../.env' });
const csv = require('fast-csv');
const path = require('path');
const { writeFileSync } = require('fs');
const { dbClient } = require('../db');
const { getHiredParticipantsReport } = require('../services/reporting');

(async () => {
  if (require.main === module) {
    try {
      await dbClient.connect();

      const results = await getHiredParticipantsReport();

      const csvStream = csv.format({ headers: true });

      results.forEach((result) => {
        csvStream.write({
          'Participant ID': result.participantId,
          FSA: result.participantFsa,
          'Employer ID': result.employerId,
          'Employer Email': result.employerEmail,
          'HCAP Position': result.hcapPosition,
          'Position Type': result.positionType,
          'Position Title': result.positionTitle,
          'Employer Site Region': result.employerRegion,
          'Employer Site': result.employerSite,
          'Start Date': result.startDate,
        });
      });

      const chunks = [];
      csvStream
        .on('data', (chunk) => chunks.push(chunk))
        .on('error', (error) => console.log(error))
        .on('end', () => {
          const string = Buffer.concat(chunks).toString();
          writeFileSync(path.join(__dirname, 'participant-stats-hired.csv'), string);
          console.log('Done');
        });

      csvStream.end();
    } catch (error) {
      console.error(`Failed to retrieve participant stats, ${error}`);
    }
  }
  return null;
})();
