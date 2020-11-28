const { Readable } = require('stream');
const readXlsxFile = require('read-excel-file/node');
const {
  validate, EmployeeBatchSchema,
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
      city: item.city,
      phoneNumber: item.phoneNumber,
      emailAddress: item.emailAddress,
      criminalRecordCheck: item.criminalRecordCheck,
    }));
  }

  return participants.map((item) => ({
    id: item.id,
    firstName: item.firstName,
    lastName: item.lastName,
    postalCode: item.postalCode,
    preferredLocation: item.preferredLocation,
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
    Lastname: 'lastName',
    FirstName: 'firstName',
    AddressLine1: 'addressLine1',
    AddressLine2: 'addressLine2',
    City: 'city',
    Province: 'province',
    Postal: 'postalCode',
    Phone1: 'phoneNumber',
    Email: 'emailAddress',
    registered: 'submissionDatetime',
    CreatedDatetime: 'maximusCreatedDatetime',
    status: 'status',
    AssignedStatus: 'assignedStatus',
    CaseManager: 'caseManager',
    'Canadian Citizen/Resident': 'canadianCitizenResident',
    'Consent Confirmed': 'consent',
    'Criminal Record Check': 'criminalRecordCheck',
    Fraser: 'fraser',
    Interior: 'interior',
    Northern: 'northern',
    'Vancouver Coastal': 'vancouverCoastal',
    'Vancouver Island': 'vancouverIsland',
    Email1: 'email1',
    Email1Date: 'email1Date',
    Email2: 'email2',
    Email2Date: 'email2Date',
    Email3a: 'email3a',
    Email3aDate: 'email3aDate',
  };

  const objectMap = (row) => {
    const object = { ...row };

    const preferredLocation = [];

    if (row.fraser === 1) preferredLocation.push('Fraser');
    if (row.interior === 1) preferredLocation.push('Interior');
    if (row.northern === 1) preferredLocation.push('Northern');
    if (row.vancouverCoastal === 1) preferredLocation.push('Vancouver Coastal');
    if (row.vancouverIsland === 1) preferredLocation.push('Vancouver Island');

    object.preferredLocation = preferredLocation.join(';');

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
