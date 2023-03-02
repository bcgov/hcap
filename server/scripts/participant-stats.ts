/* eslint-disable no-console */
import process from 'process';
import './load-env';
import * as csv from 'fast-csv';
import path from 'path';
import { writeFileSync } from 'fs';
import { dbClient } from '../db';
import { getHiredParticipantsReport } from '../services/reporting';

type MappedValues = { [name: string]: string };

type Mode = {
  filename: string;
  mapper: (result) => MappedValues;
};

const modes: {
  [name: string]: Mode;
} = {
  hired: {
    filename: 'participant-stats-hired.csv',
    mapper: (result) => ({
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
    }),
  },
  rejected: {
    filename: 'participant-stats-rejected.csv',
    mapper: (result) => ({
      'Participant ID': result.participantId,
      'Employer ID': result.employerId,
      'Employer Email': result.employerInfo ? result.employerInfo.email : null,
      'Employer Health Regions': result.employerInfo ? result.employerInfo.regions : null,
      'Reason for Rejection': result.rejection ? result.rejection.final_status : null,
      'Date Rejected': result.date,
    }),
  },
  'no-offers': {
    filename: 'participant-stats-no-offers.csv',
    mapper: (result) => ({
      'Participant ID': result.id,
      'Participant Email': result.emailAddress,
      FSA: result.postalCodeFsa,
      Regions: result.preferredLocation,
      Interest: result.interested,
      'Date Last Updated': result.userUpdatedAt,
    }),
  },
  'in-progress': {
    filename: 'participant-stats-in-progress.csv',
    mapper: (result) => ({
      'Participant ID': result.participantId,
      FSA: result.participantFsa,
      'Employer ID': result.employerId,
      'Employer Email': result.employerEmail,
      'Employer Health Region': result.employerhealthRegion,
    }),
  },
};

(async () => {
  try {
    const modeName = process.argv[2];
    if (!(modeName in modes)) {
      console.error(`Invalid category: ${modeName}`);
      console.error(
        `Please specify one of the following categories: ${Object.keys(modes).join(', ')}`
      );
      process.exit();
    }
    const mode = modes[modeName];

    await dbClient.connect();

    const results = await getHiredParticipantsReport();

    const csvStream = csv.format({ headers: true });

    results.forEach((result) => {
      csvStream.write(mode.mapper(result));
    });

    const chunks = [];
    csvStream
      .on('data', (chunk) => chunks.push(chunk))
      .on('error', (error) => console.log(error))
      .on('end', () => {
        const string = Buffer.concat(chunks).toString();
        writeFileSync(path.join(__dirname, mode.filename), string);
        console.log('Done');
        process.exit();
      });

    csvStream.end();
  } catch (error) {
    console.error(`Failed to retrieve participant stats, ${error}`);
    process.exit();
  }
})();
