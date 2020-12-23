const readXlsxFile = require('node-xlsx').default;
const {
  validate, ParticipantBatchSchema, isBooleanValue, evaluateBooleanAnswer,
} = require('../validation.js');
const { dbClient, collections } = require('../db');
const { createRows, verifyHeaders } = require('../utils');
const { userRegionQuery } = require('./user.js');

const setParticipantStatus = async (
  employerId,
  participantId,
  status,
) => dbClient.db.withTransaction(async (tx) => {
  await tx[collections.PARTICIPANTS_STATUS].update({
    employer_id: employerId,
    participant_id: participantId,
    current: true,
  }, { current: false });

  await tx[collections.PARTICIPANTS_STATUS].save({
    employer_id: employerId,
    participant_id: participantId,
    status,
    current: true,
  });

  const participant = await tx[collections.PARTICIPANTS].findDoc({
    id: participantId,
  });

  if (status === 'prospecting') {
    return {
      emailAddress: participant[0].emailAddress,
      phoneNumber: participant[0].phoneNumber,
      status,
    };
  }

  return { status };
});

// When MassiveJS executes a join query, it returns results with underscored key names
// This maps results into expected participant objects with a `statusInfos` property
const decomposeParticipantStatus = (raw) => {
  const participantsMap = new Map();
  const participantsStatusMap = new Map();

  raw.forEach((item) => {
    participantsMap.set(item[`${collections.PARTICIPANTS}__id`], {
      ...item[`${collections.PARTICIPANTS}__body`],
      id: item[`${collections.PARTICIPANTS}__id`],
    });

    const participantStatus = participantsStatusMap.get(item[`${collections.PARTICIPANTS_STATUS}__participant_id`]);

    participantsStatusMap.set(
      item[`${collections.PARTICIPANTS_STATUS}__participant_id`],
      participantStatus ? [...participantStatus, item] : [item],
    );
  });

  const participants = [];

  participantsMap.forEach((item, participantId) => {
    let statusInfos = participantsStatusMap.get(participantId);
    if (statusInfos) {
      statusInfos = statusInfos.map((statusInfo) => ({
        createdAt: statusInfo[`${collections.PARTICIPANTS_STATUS}__created_at`],
        employerId: statusInfo[`${collections.PARTICIPANTS_STATUS}__employer_id`],
        status: statusInfo[`${collections.PARTICIPANTS_STATUS}__status`],
      }));
    } else {
      statusInfos = [];
    }
    participants.push({
      ...item,
      statusInfos,
    });
  });

  return participants;
};

const getParticipants = async (user) => {
  const criteria = user.isSuperUser || user.isMoH ? {} : userRegionQuery(user.regions, 'preferredLocation');
  let table = dbClient.db[collections.PARTICIPANTS];
  const showStatus = user.isHA || user.isEmployer || user.isSuperUser;
  if (showStatus) {
    table = table.join({
      [collections.PARTICIPANTS_STATUS]: {
        type: 'LEFT OUTER',
        on: { participant_id: 'id', current: true },
      },
    });
  }

  if (!criteria) return []; // This happens when user has no regions assigned

  let participants = await table.findDoc(criteria);

  if (showStatus) {
    participants = decomposeParticipantStatus(participants);
  }

  if (user.isMoH || user.isSuperUser) { // Only return relevant fields
    return participants.map((item) => ({
      id: item.id,
      firstName: item.firstName,
      lastName: item.lastName,
      postalCodeFsa: item.postalCodeFsa,
      preferredLocation: item.preferredLocation,
      nonHCAP: item.nonHCAP,
      interested: item.interested,
      crcClear: item.crcClear,
    }));
  }

  // Returned participants for employers
  return participants
    .filter((item) => (
      evaluateBooleanAnswer(item.interested)
      && evaluateBooleanAnswer(item.crcClear)))
    .map((item) => {
      let participant = {
        id: item.id,
        firstName: item.firstName,
        lastName: item.lastName,
        postalCodeFsa: item.postalCodeFsa,
        preferredLocation: item.preferredLocation,
        nonHCAP: item.nonHCAP,
      };

      const statusInfos = item.statusInfos?.find((statusInfo) => statusInfo.employerId === user.id);

      if (statusInfos) {
        participant.statusInfos = Array.isArray(statusInfos) ? statusInfos : [statusInfos];
        const hasProspectingStatus = participant.statusInfos.find((statusInfo) => statusInfo.status === 'prospecting');
        if (hasProspectingStatus) {
          participant = {
            ...participant,
            phoneNumber: item.phoneNumber,
            emailAddress: item.emailAddress,
          };
        }
      }

      return participant;
    });
};

const parseAndSaveParticipants = async (fileBuffer) => {
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

  const xlsx = readXlsxFile.parse(fileBuffer, { raw: true });
  verifyHeaders(xlsx[0].data, columnMap);
  const rows = createRows(xlsx[0].data, columnMap);
  await validate(ParticipantBatchSchema, rows);
  const response = [];
  const promises = rows.map((row) => dbClient.db.saveDoc(collections.PARTICIPANTS, objectMap(row)));
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

module.exports = { parseAndSaveParticipants, getParticipants, setParticipantStatus };
