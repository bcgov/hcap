/* eslint-disable no-restricted-syntax, no-await-in-loop, max-len */
const { readFileSync } = require('fs');
const { join } = require('path');
const readXlsxFile = require('node-xlsx').default;
const { dbClient } = require('../db/db.js');
const { collections } = require('../db/schema.js');

const columnNames = ['ClientID', 'EOI - FHA', 'EOI - IHA', 'EOI - NHA', 'EOI - VCHA', 'EOI - VIHA'];
const columnValues = ['Fraser', 'Interior', 'Northern', 'Vancouver Coastal', 'Vancouver Island'];

// Program area provided a spreadsheet with participants' preferred health regions as columns
// These columns contain textual quasi-booleans to denote whether the respective region is preferred
// Booleans look like "YES" for truthy and "NO" or "NULL" for falsy (all case-insensitive)
const textualBoolean = (v) => {
  if (typeof v !== 'string') throw Error(`Invalid boolean: ${v} (type: ${typeof v})`);
  switch (v.trim().toUpperCase()) {
    case 'YES':
      return true;
    case 'NULL':
    case 'NO':
      return false;
    default:
      throw Error(`Invalid boolean string: ${v}`); // Better safe than sorry
  }
};

exports.up = async () => {
  const file = readFileSync(join(__dirname, 'assets', 'reassign-participant-regions.xlsx'));
  const sheet = readXlsxFile.parse(file, { raw: true })?.[0]?.data; // Only need the first sheet
  const [headers, ...data] = sheet; // First line is headers

  if (!headers.every((e, i) => columnNames[i] === e)) throw Error('Unexpected headers');

  const changes = data.map((row) => ({
    id: row?.[0],
    preferredLocation: row
      .slice(1) // Ignore Maximus ID column
      .map((v, i) => (textualBoolean(v) ? columnValues[i] : null)) // Map from textual boolean to HA string value
      .filter((v) => v != null) // Remove null values where column was falsy
      .join(';'), // For some reason, we are using a semicolon-separated string instead of a JSON array here
  }));

  const currentParticipants = await dbClient.db[collections.PARTICIPANTS].findDoc(
    { 'maximusId::int': changes.map((i) => i.id) }, // Find all relevant participants to build history
  );

  for (const change of changes) {
    const currentParticipant = currentParticipants.find((i) => i.maximusId === change.id);
    // We could throw here if currentParticipant is undefined
    // Currently, this is allowed and will set participant history item from value to null
    // if (!currentParticipant) throw Error(`Could not find existing participant with Maximus ID ${change.id}`);
    change.history = currentParticipant?.history || [];
    change.history.push({
      timestamp: new Date(),
      changes: [{
        field: 'preferredLocation',
        to: change.preferredLocation,
        from: currentParticipant?.preferredLocation || null,
      }],
    });
  }

  await dbClient.db.withTransaction(async (tx) => {
    for (const change of changes) {
      await tx[collections.PARTICIPANTS].updateDoc(
        { maximusId: change.id },
        { preferredLocation: change.preferredLocation, history: change.history },
      );
    }
  });
};
