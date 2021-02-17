const readXlsxFile = require('node-xlsx').default;
const {
  validate, ParticipantBatchSchema, isBooleanValue,
} = require('../validation.js');
const { dbClient, collections } = require('../db');
const { createRows, verifyHeaders } = require('../utils');
const { ParticipantsFinder } = require('./participants-helper');

const setParticipantStatus = async (
  employerId,
  participantId,
  status,
  data, // JSONB on the status row
) => dbClient.db.withTransaction(async (tx) => {
  if (status !== 'rejected') {
    const items = await tx[collections.PARTICIPANTS_STATUS].find({
      participant_id: participantId,
      status: 'hired',
      current: true,
    });

    if (items.length > 0) return { status: 'already_hired' };
  }

  const item = await tx[collections.PARTICIPANTS_STATUS].findOne({
    participant_id: participantId,
    employer_id: employerId,
    current: true,
  });

  // Check the desired status against the current status:
  // -- Rejecting a participant is allowed even if they've been hired elsewhere (handled above)
  // -- Open is the starting point, there is no way to transition here from any other status
  // -- If engaging (prospecting), participant must be coming from open, null, or rejected status
  // -- If interviewing, participant must be coming from prospecting status
  // -- If offer made, must be coming from interviewing
  // -- If hiring, must be coming from offer made
  if ((status === 'open')
    || (status === 'prospecting' && item !== null && item.status !== 'open' && item.status !== 'rejected')
    || (status === 'interviewing' && item?.status !== 'prospecting')
    || (status === 'offer_made' && item?.status !== 'interviewing')
    || (status === 'hired' && item?.status !== 'offer_made')
  ) return { status: 'invalid_status_transition' };

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
    data,
  });

  const participant = await tx[collections.PARTICIPANTS].findDoc({
    id: participantId,
  });

  if (['prospecting', 'interviewing', 'offer_made', 'hired'].includes(status)) {
    return {
      emailAddress: participant[0].emailAddress,
      phoneNumber: participant[0].phoneNumber,
      status,
    };
  }

  return { status };
});

const getParticipantByID = async (participantInfo) => {
  const participant = await dbClient.db[collections.PARTICIPANTS].findDoc({
    id: participantInfo.id,
  });
  return participant;
};

const updateParticipant = async (participantInfo) => {
  // The below reduce function unpacks the most recent changes in the history
  // and builds them into an object to be used for the update request
  const changes = participantInfo.history[0].changes.reduce((acc, change) => {
    const { field, to } = change;
    return { ...acc, [field]: to };
  }, { history: participantInfo.history, userUpdatedAt: new Date().toJSON() });

  const participant = await dbClient.db[collections.PARTICIPANTS].updateDoc({
    id: participantInfo.id,
  }, changes);

  return participant;
};

const getParticipants = async (user, pagination, sortField,
  regionFilter, fsaFilter, lastNameFilter, emailFilter, statusFilters) => {
  const participantsFinder = new ParticipantsFinder(dbClient, user);

  // While an employer, if we add 'open' as one of the status filters we won't
  // be able to filter lastName and emailAddress. The ideal way would be
  // creating one more AND/OR clausule to handle edge cases when we need to filter
  // lastName or email with statuses 'open' AND 'hired', for example. Setting this
  // as a TODO since there's no such case in the application yet.
  const filterLastNameAndEmail = user.isSuperUser || user.isMoH
    || ((user.isHA || user.isEmployer) && !statusFilters.includes('open'));

  const participants = await participantsFinder
    .filterRegion(regionFilter)
    .filterParticipantFields({
      postalCodeFsa: fsaFilter,
      lastName: filterLastNameAndEmail && lastNameFilter,
      emailAddress: filterLastNameAndEmail && emailFilter,
    })
    .filterStatus(statusFilters)
    .paginate(pagination, sortField)
    .run();

  const { table, criteria } = participantsFinder;
  const paginationData = pagination && {
    offset: (pagination.offset ? Number(pagination.offset) : 0) + participants.length,
    total: Number(await table.count(criteria || {})),
  };

  if (user.isSuperUser || user.isMoH) {
    return {
      data: participants.map((item) => { // Only return relevant fields
        let returnStatus = 'Pending';
        const progressStats = {
          prospecting: 0,
          interviewing: 0,
          offer_made: 0,
          hired: 0,
          total: 0,
        };

        if (item.interested === 'no') returnStatus = 'Withdrawn';
        if (item.interested === 'yes') returnStatus = 'Available';

        item.statusInfos.forEach((entry) => {
          progressStats[entry.status] += 1;
          progressStats.total += 1;
        });

        const { total, hired } = progressStats;
        if (total > 0) returnStatus = (total === 1) ? 'In Progress' : `In Progress (${progressStats.total})`;
        if (hired) returnStatus = 'Hired';

        return {
          id: item.id,
          firstName: item.firstName,
          lastName: item.lastName,
          postalCodeFsa: item.postalCodeFsa,
          preferredLocation: item.preferredLocation,
          nonHCAP: item.nonHCAP,
          interested: item.interested,
          crcClear: item.crcClear,
          callbackStatus: item.callbackStatus,
          statusInfo: returnStatus,
          userUpdatedAt: item.userUpdatedAt,
          progressStats,
        };
      }),
      ...pagination && { pagination: paginationData },
    };
  }

  // Returned participants for employers
  return {
    data: participants.map((item) => {
      let participant = {
        id: item.id,
        firstName: item.firstName,
        lastName: item.lastName,
        postalCodeFsa: item.postalCodeFsa,
        preferredLocation: item.preferredLocation,
        nonHCAP: item.nonHCAP,
        userUpdatedAt: item.userUpdatedAt,
        callbackStatus: item.callbackStatus,
      };

      const hiredBySomeoneElseStatus = item.statusInfos?.find((statusInfo) => statusInfo.status === 'hired'
        && statusInfo.employerId !== user.id);

      if (hiredBySomeoneElseStatus) {
        if (!participant.statusInfos) participant.statusInfos = [];

        participant.statusInfos.push({
          createdAt: hiredBySomeoneElseStatus.createdAt,
          status: 'already_hired',
        });
      }

      const statusInfos = item.statusInfos?.find((statusInfo) => statusInfo.employerId === user.id);

      if (statusInfos) {
        if (!participant.statusInfos) participant.statusInfos = [];

        participant.statusInfos.unshift(statusInfos);
        const showContactInfo = participant.statusInfos.find((statusInfo) => ['prospecting', 'interviewing', 'offer_made', 'hired'].includes(statusInfo.status));
        if (showContactInfo && !hiredBySomeoneElseStatus) {
          participant = {
            ...participant,
            phoneNumber: item.phoneNumber,
            emailAddress: item.emailAddress,
          };
        }
      }

      return participant;
    }),
    ...pagination && { pagination: paginationData },
  };
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
    object.callbackStatus = 'false';
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

const makeParticipant = async (participantJson) => {
  const res = dbClient.db.saveDoc(collections.PARTICIPANTS, participantJson);
  return res;
};

module.exports = {
  parseAndSaveParticipants,
  getParticipants,
  getParticipantByID,
  updateParticipant,
  setParticipantStatus,
  makeParticipant,
};
