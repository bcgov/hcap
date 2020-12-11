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

  return tx[collections.PARTICIPANTS_STATUS].save({
    employer_id: employerId,
    participant_id: participantId,
    status,
    current: true,
  });
});

const flatJoinedParticipantStatus = (raw) => {
  const prticipantsMap = new Map();
  const participantsStatusMap = new Map();

  raw.forEach((item) => {
    prticipantsMap.set(item[`${collections.PARTICIPANTS}__id`], {
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

  prticipantsMap.forEach((item, participantId) => {
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

const getParticipants = async (user, options) => {
  const criteria = user.isSuperUser || user.isMoH ? {} : userRegionQuery(user.regions, 'preferredLocation');
  let table = dbClient.db[collections.PARTICIPANTS];
  const showStatus = options && options.status;
  if (showStatus) {
    table = table.join({
      [collections.PARTICIPANTS_STATUS]: {
        type: 'LEFT OUTER',
        on: { participant_id: 'id', current: true },
      },
    });
  }

  let participants = criteria
    ? await table.findDoc(criteria)
    : [];

  if (showStatus) {
    participants = flatJoinedParticipantStatus(participants);
  }

  if (user.isSuperUser) {
    return participants;
  }

  if (user.isMoH) {
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

  // HCAP-220: Filtering data based on candidate who is interested and cleared CRC
  return participants
    .filter((item) => (
      evaluateBooleanAnswer(item.interested)
      && evaluateBooleanAnswer(item.crcClear)))
    .map((item) => ({
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
