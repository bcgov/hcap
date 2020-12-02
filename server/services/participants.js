const readXlsxFile = require('node-xlsx').default;
const {
  validate, EmployeeBatchSchema, isBooleanValue,
} = require('../validation.js');
const { dbClient, collections } = require('../db');
const { userRegionQuery } = require('./user.js');

const getParticipants = async (user) => {
  const criteria = user.isSuperUser || user.isMOH ? {} : userRegionQuery(user.regions, 'preferredLocation');
  const participants = criteria ? await dbClient.db[collections.APPLICANTS].findDoc(criteria) : [];

  if (user.isSuperUser) {
    return participants;
  }

  if (user.isMOH) {
    return participants.map((item) => ({
      id: item.id,
      firstName: item.firstName,
      lastName: item.lastName,
      postalCode: item.postalCode,
      preferredLocation: item.preferredLocation,
      nonHCAP: item.nonHCAP,
      interested: item.interested,
      crcClear: item.crcClear,
    }));
  }

  return participants.map((item) => ({
    id: item.id,
    firstName: item.firstName,
    lastName: item.lastName,
    postalCode: item.postalCode,
    preferredLocation: item.preferredLocation,
    nonHCAP: item.nonHCAP,
    /// / TODO uncomment/rework on HCAP-222
    // phoneNumber: item.phoneNumber,
    // emailAddress: item.emailAddress,
  }));
};

const parseAndSaveParticipants = async (file) => {
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

  const verifyHeaders = (dataRows) => {
    const headers = dataRows[0];
    Object.keys(columnMap).forEach((columName) => {
      if (!headers.includes(columName)) {
        throw new Error(`Missing header "${columName}" in participants spreadsheet`);
      }
    });
  };

  const createRows = (dataRows) => {
    const headers = dataRows[0];
    const rowSize = dataRows.length;
    const rows = [];
    dataRows.slice(1, rowSize).forEach((dataRow) => {
      if (dataRow.length === 0) return; // ignore empty rows
      const row = {};
      headers.forEach((header, index) => {
        row[columnMap[header]] = dataRow[index];
      });
      rows.push(row);
    });
    return rows;
  };

  const objectMap = (row) => {
    const object = { ...row };

    const preferredLocation = [];

    if (row.fraser === 1 || (isBooleanValue(row.fraser))) preferredLocation.push('Fraser');
    if (row.interior === 1 || (isBooleanValue(row.interior))) preferredLocation.push('Interior');
    if (row.northern === 1 || (isBooleanValue(row.northern))) preferredLocation.push('Northern');
    if (row.vancouverCoastal === 1 || (isBooleanValue(row.vancouverCoastal))) preferredLocation.push('Vancouver Coastal');
    if (row.vancouverIsland === 1 || (isBooleanValue(row.vancouverIsland))) preferredLocation.push('Vancouver Island');

    object.preferredLocation = preferredLocation.join(';');

    delete object.fraser;
    delete object.interior;
    delete object.northern;
    delete object.vancouverCoastal;
    delete object.vancouverIsland;

    return object;
  };

  const xlsx = readXlsxFile.parse(file.buffer, { raw: true });
  verifyHeaders(xlsx[0].data);
  const rows = createRows(xlsx[0].data);
  await validate(EmployeeBatchSchema, rows);
  const response = [];
  const promises = rows.map((row) => dbClient.db.saveDoc(collections.APPLICANTS, objectMap(row)));
  const results = await Promise.allSettled(promises);
  results.forEach((result, index) => {
    const id = rows[index].maximusId;
    switch (result.status) {
      case 'fulfilled':
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

module.exports = { parseAndSaveParticipants, getParticipants };
