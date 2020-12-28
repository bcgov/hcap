const readXlsxFile = require('node-xlsx').default;
const {
  validate, ParticipantBatchSchema, isBooleanValue,
} = require('../validation.js');
const { dbClient, collections } = require('../db');
const { createRows, verifyHeaders } = require('../utils');
const { userRegionQuery } = require('./user.js');

const setParticipantStatus = async (
  employerId,
  participantId,
  status,
  data, // JSONB on the status row
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

const decomposeParticipantStatus = (raw, tableAliases) => raw.map((participant) => {
  const statusInfos = [];

  tableAliases.forEach((table) => {
    statusInfos.push(...participant[table].map((statusInfo) => ({
      createdAt: statusInfo.created_at,
      employerId: statusInfo.employer_id,
      status: statusInfo.status,
    })));
  });

  return {
    ...participant.body,
    id: participant.id,
    statusInfos,
  };
});

const getParticipants = async (user, pagination, sortField,
  regionFilter, fsaFilter, statusFilters) => {
  const showStatus = user.isHA || user.isEmployer || user.isSuperUser;
  let criteria = user.isSuperUser || user.isMoH
    ? {
      ...regionFilter && { 'body.preferredLocation ilike': `%${regionFilter}%` },
    }
    : {
      ...(regionFilter && user.regions.includes(regionFilter))
        ? { 'body.preferredLocation ilike': `%${regionFilter}%` }
        : { and: [userRegionQuery(user.regions, 'body.preferredLocation')] },
      'body.interested': 'yes',
      'body.crcClear': 'yes',
    };

  criteria = {
    ...criteria,
    ...fsaFilter && { 'body.postalCodeFsa ilike': `${fsaFilter}%` },
  };

  let table = dbClient.db[collections.PARTICIPANTS];
  if (showStatus) {
    table = table.join({
      [collections.PARTICIPANTS_STATUS]: {
        type: 'LEFT OUTER',
        relation: collections.PARTICIPANTS_STATUS,
        on: {
          participant_id: 'id',
          current: true,
          ...(user.isHA || user.isEmployer) && { employer_id: user.id },
        },
      },
    });
  }

  if (statusFilters) {
    const newStatusFilters = statusFilters.includes('open')
      // if 'open' is found adds also null because no status
      // means that the participant is open as well
      ? [null, ...statusFilters]
      : statusFilters;
    const statusQuery = {
      or: newStatusFilters.map((status) => ({ [`${collections.PARTICIPANTS_STATUS}.status`]: status })),
    };
    if (criteria.and) {
      criteria.and.push(statusQuery);
    } else {
      criteria.and = [statusQuery];
    }
  }

  if (!criteria) return []; // This happens when user has no regions assigned

  const options = pagination && {
    // ID is the default sort column
    order: [{
      field: 'id',
      direction: pagination.direction || 'asc',
    }],
    /*
      Using limit/offset pagination may decrease performance in the Postgres instance,
      however this is the only way to sort columns that does not have a deterministic
      ordering such as firstName.
      See more details: https://massivejs.org/docs/options-objects#keyset-pagination
    */
    ...pagination.offset && { offset: pagination.offset },
    ...pagination.pageSize && { limit: pagination.pageSize },
  };

  if (sortField && sortField !== 'id' && options.order) {
    // If a field to sort is provided we put that as first priority
    options.order.unshift({
      field: `body.${sortField}`,
      direction: pagination.direction || 'asc',
    });
  }

  let participants = await table.find(criteria, options);

  participants = decomposeParticipantStatus(participants, [collections.PARTICIPANTS_STATUS]);

  const paginationData = pagination && {
    offset: (pagination.offset ? Number(pagination.offset) : 0) + participants.length,
    total: Number(await table.countDoc(criteria || {})),
  };

  if (user.isSuperUser) {
    return {
      data: participants,
      ...pagination && { pagination: paginationData },
    };
  }

  if (user.isMoH) {
    return {
      data: participants.map((item) => ({ // Only return relevant fields
        id: item.id,
        firstName: item.firstName,
        lastName: item.lastName,
        postalCodeFsa: item.postalCodeFsa,
        preferredLocation: item.preferredLocation,
        nonHCAP: item.nonHCAP,
        interested: item.interested,
        crcClear: item.crcClear,
      })),
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
      };

      const statusInfos = item.statusInfos?.find((statusInfo) => statusInfo.employerId === user.id);

      if (statusInfos) {
        participant.statusInfos = Array.isArray(statusInfos) ? statusInfos : [statusInfos];
        const showContactInfo = participant.statusInfos.find((statusInfo) => ['prospecting', 'interviewing', 'offer_made', 'hired'].includes(statusInfo.status));
        if (showContactInfo) {
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
