import readXlsxFile from 'node-xlsx';
import { createRows, verifyHeaders } from '../../utils';
import { dbClient, collections } from '../../db';
import { validate, ParticipantBatchSchema, isBooleanValue } from '../../validation';

// TODO: DELETE THIS
/** @deprecated - unused everywhere but tests. Should be deleted once tests are updated to match. */
export const parseAndSaveParticipants = async (fileBuffer) => {
  const columnMap = {
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

  const objectMap = (row) => {
    const object = { ...row };

    const preferredLocation = [];

    if (row.fraser === 1 || isBooleanValue(row.fraser)) preferredLocation.push('Fraser');
    if (row.interior === 1 || isBooleanValue(row.interior)) preferredLocation.push('Interior');
    if (row.northern === 1 || isBooleanValue(row.northern)) preferredLocation.push('Northern');
    if (row.vancouverCoastal === 1 || isBooleanValue(row.vancouverCoastal))
      preferredLocation.push('Vancouver Coastal');
    if (row.vancouverIsland === 1 || isBooleanValue(row.vancouverIsland))
      preferredLocation.push('Vancouver Island');

    object.preferredLocation = preferredLocation.join(';');
    object.callbackStatus = false;
    object.userUpdatedAt = new Date().toJSON();

    delete object.fraser;
    delete object.interior;
    delete object.northern;
    delete object.vancouverCoastal;
    delete object.vancouverIsland;

    return object;
  };

  const xlsx = readXlsxFile.parse(fileBuffer, { raw: true });
  verifyHeaders(xlsx[0].data, columnMap);
  let rows = createRows(xlsx[0].data, columnMap);
  await validate(ParticipantBatchSchema, rows);
  const lowercaseMixed = (v) => (typeof v === 'string' ? v.toLowerCase() : v);
  rows = rows.map((row) => ({
    ...row,
    interested: lowercaseMixed(row.interested),
  }));
  const response = [];
  const promises = rows.map((row) => dbClient.db.saveDoc(collections.PARTICIPANTS, objectMap(row)));
  const results = await Promise.allSettled(promises);

  results.forEach((result, index) => {
    const id = rows[index].maximusId;
    switch (result.status) {
      case 'fulfilled':
        // Update coordinates for all fulfilled promises
        response.push({ id, status: 'Success' });
        break;
      default:
        if (result.reason.code === '23505') {
          response.push({ id, status: 'Duplicate' });
        } else {
          response.push({ id, status: 'Error', message: result.reason });
        }
    }
  });
  return response;
};
