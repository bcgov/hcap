/* eslint-disable camelcase */
const { readFileSync } = require('fs');
const { join } = require('path');
const readXlsxFile = require('node-xlsx').default;

const { dbClient, collections } = require('../db');
const { createRows, verifyHeaders } = require('../utils');

const siteColumnMap = {
  'HCAP Site ID': 'siteId',
  'Site Name': 'siteName',
  RHO: 'isRHO',
  Allocation: 'allocation',
  'Street Address': 'address',
  'Health Authority': 'healthAuthority',
  City: 'city',
  'Post Code': 'postalCode',
  'Registered Business Name': 'registeredBusinessName',
  'Operator Name': 'operatorName',
  'Operator Contact First Name': 'operatorContactFirstName',
  'Operator Contact Last Name': 'operatorContactLastName',
  'Operator Contact Email': 'operatorEmail',
  'Operator Contact Phone': 'operatorPhone',
  'Site Contact First Name': 'siteContactFirstName',
  'Site Contact Last Name': 'siteContactLastName',
  'Site Contact Phone Number': 'siteContactPhoneNumber',
  'Site Contact Email': 'siteContactEmailAddress',
};

const participantColumnMap = {
  ClientID: 'maximusId',
  Surname: 'lastName',
  Name: 'firstName',
  PostalCode: 'postalCode',
  'Post Code FSA': 'postalCodeFsa',
  Phone: 'phoneNumber',
  Email: 'emailAddress',
  'EOI - FHA': 'fraser',
  'EOI - IHA': 'interior',
  'EOI - NHA': 'northern',
  'EOI - VCHA': 'vancouverCoastal',
  'EOI - VIHA': 'vancouverIsland',
  'CB1: Still Interested': 'interested',
  'CB8: Non-HCAP Opportunities': 'nonHCAP',
  'CB13: CRC Clear': 'crcClear',
};

exports.up = async () => {
  const nodeEnv = process.env.NODE_ENV;
  if (nodeEnv === 'test' || nodeEnv === 'local' || nodeEnv === 'dev') {
    // Seed Sites
    const sitesFile = readFileSync(join(__dirname, 'assets', 'sites.xlsx'));
    const sitesSheet = readXlsxFile.parse(sitesFile, { raw: true })?.[0]?.data; // Only need the first sheet
    verifyHeaders(sitesSheet, siteColumnMap);
    const sitesRows = createRows(sitesSheet, siteColumnMap);

    sitesRows.forEach((row) => dbClient.db[collections.EMPLOYER_SITES].save(row));

    // Seed Participants
    const participantsFile = readFileSync(join(__dirname, 'assets', 'participants.xlsx'));
    const participantsSheet = readXlsxFile.parse(participantsFile, { raw: true })?.[0]?.data;
    verifyHeaders(participantsSheet, participantColumnMap);
    const participantsRows = createRows(participantsSheet, siteColumnMap);

    participantsRows.forEach((row) => dbClient.db[collections.PARTICIPANTS].save(row));
  }
};
