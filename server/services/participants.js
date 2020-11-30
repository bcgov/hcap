const { Readable } = require('stream');
const readXlsxFile = require('read-excel-file/node');
const {
  validate, EmployeeBatchSchema, isBooleanValue,
} = require('../validation.js');
const { dbClient, collections } = require('../db');
const { getUserRoles, getUserRegionsCriteria } = require('./user.js');

const getParticipants = async (req) => {
  const roles = getUserRoles(req);
  const isMOH = roles.includes('ministry_of_health');
  const isSuperUser = roles.includes('superuser');
  const criteria = isSuperUser || isMOH ? {} : getUserRegionsCriteria(req, 'preferredLocation');
  const participants = criteria ? await dbClient.db[collections.APPLICANTS].findDoc(criteria) : [];

  if (isSuperUser) {
    return participants;
  }

  if (isMOH) {
    return participants.map((item) => ({
      id: item.id,
      firstName: item.firstName,
      lastName: item.lastName,
      postalCode: item.postalCode,
      preferredLocation: item.preferredLocation,
      phoneNumber: item.phoneNumber,
      emailAddress: item.emailAddress,
      interested: item.interested || null,
      nonHCAP: item.nonHCAP || null,
    }));
  }

  return participants.map((item) => ({
    id: item.id,
    firstName: item.firstName,
    lastName: item.lastName,
    postalCode: item.postalCode,
    preferredLocation: item.preferredLocation,
    interested: item.interested || null,
    nonHCAP: item.nonHCAP || null,
  }));
};

const parseAndSaveParticipants = async (file) => {
  const bufferToStream = (binary) => new Readable({
    read() {
      this.push(binary);
      this.push(null);
    },
  });

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

    // Defaulting optional values with null
    const optingForNonHCAP = row.nonHCAP;
    const participantInterested = row.interested;
    object.nonHCAP = optingForNonHCAP
    && isBooleanValue(optingForNonHCAP) ? optingForNonHCAP.toLowerCase() : null;
    object.interested = participantInterested
    && isBooleanValue(optingForNonHCAP) ? participantInterested.toLowerCase() : null;

    delete object.fraser;
    delete object.interior;
    delete object.northern;
    delete object.vancouverCoastal;
    delete object.vancouverIsland;

    return object;
  };

  const { rows } = await readXlsxFile(bufferToStream(file.buffer), { map: columnMap });
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
