/* eslint-disable no-restricted-syntax, no-await-in-loop, no-console */
const { readFileSync } = require('fs');
const { join } = require('path');
const readXlsxFile = require('node-xlsx').default;
const { dbClient } = require('../db/db.js');
const { collections } = require('../db/schema.js');

const columnNames = ['Participant ID', 'Employer ID', 'Site ID']; // Basic validation of XLSX file

exports.up = async () => {
  const file = readFileSync(join(__dirname, 'assets', 'orphaned-hires-20210316.xlsx'));
  const sheet = readXlsxFile.parse(file, { raw: true })?.[0]?.data; // Only need the first sheet
  const [headers, ...data] = sheet; // First line is headers

  if (!headers.every((e, i) => columnNames[i] === e)) throw Error('Unexpected headers');

  let changes = data.map((row) => ({
    participantId: row?.[0],
    employerId: row?.[1],
    siteId: row?.[2],
    history: [{ // Don't append to history as this is the first use on participants statuses
      timestamp: new Date(),
      changes: [{
        field: 'siteId',
        from: null,
        to: row?.[2],
      }],
    }],
  }));

  // Find all relevant participant statuses to sanity check change XLSX document
  const currentStatuses = await dbClient.db[collections.PARTICIPANTS_STATUS].find({
    participant_id: changes.map((i) => `${i.participantId}`),
    current: true,
    status: 'hired',
  });

  // Filter out changes for statuses that are not found in the DB
  // This allows the migration to pass on dev and test
  changes = changes.filter((change) => currentStatuses.includes((currentStatus) => (
    currentStatus.participant_id === change.participantId
  )));

  const errors = changes.map((change) => {
    const currentStatus = currentStatuses.find((i) => i.participant_id === change.participantId);
    if (currentStatus.data.siteId) return `${change.participantId} has existing site ID`;
    if (change.employerId !== currentStatus.employer_id) return `${change.participantId} mismatched employer ID`;
    return null;
  }).filter((error) => error);

  if (errors.length !== 0) { // Check for errors and throw if found
    console.error(`${errors.length} errors found for the following participant ID(s)`);
    console.error(errors.join('\n'));
    throw Error('Bad change XLSX document');
  }

  await dbClient.db.withTransaction(async (tx) => {
    for (const change of changes) {
      await tx[collections.PARTICIPANTS_STATUS].updateDoc(
        {
          participant_id: change.participantId,
          employer_id: change.employerId,
          current: true,
          status: 'hired',
        },
        { siteId: change.siteId, history: change.history },
        { body: 'data' }, // Participants status table is not a MassiveJS document table
      );
    }
  });

  console.log(`Updated the site ID of ${changes.length} hired participant statuses`);
  console.log(`Skipped ${data.length - changes.length} rows that were not found in the DB`);
};
