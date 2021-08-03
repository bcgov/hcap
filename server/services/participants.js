/* eslint-disable camelcase */
const assert = require('assert');
const readXlsxFile = require('node-xlsx').default;
const { validate, ParticipantBatchSchema, isBooleanValue } = require('../validation.js');
const { dbClient, collections } = require('../db');
const { createRows, verifyHeaders } = require('../utils');
const { ParticipantsFinder } = require('./participants-helper');

const setParticipantStatus = async (
  employerId,
  participantId,
  status,
  data // JSONB on the status row
) =>
  dbClient.db.withTransaction(async (tx) => {
    if (status !== 'rejected' && status !== 'archived') {
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
    // -- If restoring a user from being archived, any status should be valid
    if (
      (status === 'open' ||
        (status === 'prospecting' &&
          item !== null &&
          item.status !== 'open' &&
          item.status !== 'rejected') ||
        (status === 'interviewing' && item?.status !== 'prospecting') ||
        (status === 'offer_made' && item?.status !== 'interviewing') ||
        (status === 'hired' && item?.status !== 'offer_made')) &&
      item?.status !== 'archived'
    )
      return { status: 'invalid_status_transition' };

    await tx[collections.PARTICIPANTS_STATUS].update(
      {
        employer_id: employerId,
        participant_id: participantId,
        current: true,
      },
      { current: false }
    );

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

    // Now check if current status is archived then set interested flag
    // Only do this for duplicate records
    if (status === 'archived') {
      // eslint-disable-next-line no-use-before-define
      await withdrawParticipant(participant[0]);
    }

    if (['prospecting', 'interviewing', 'offer_made', 'hired'].includes(status)) {
      return {
        emailAddress: participant[0].emailAddress,
        phoneNumber: participant[0].phoneNumber,
        status,
      };
    }

    return { status };
  });

const getHiredParticipantsBySite = async (siteID) => {
  const participants = await dbClient.db[collections.PARTICIPANTS_STATUS]
    .join({
      participantJoin: {
        type: 'LEFT OUTER',
        relation: collections.PARTICIPANTS,
        decomposeTo: 'object',
        on: { id: 'participant_id' },
      },
    })
    .find({
      current: true,
      status: 'hired',
      'data.site': String(siteID),
    });

  return participants;
};

const getWithdrawnParticipantsBySite = async (siteID) => {
  const participants = await dbClient.db[collections.PARTICIPANTS_STATUS]
    .join({
      participantJoin: {
        type: 'LEFT OUTER',
        relation: collections.PARTICIPANTS,
        decomposeTo: 'object',
        on: { id: 'participant_id' },
      },
    })
    .find({
      current: true,
      status: 'archived',
    });

  // In order to make sure we're returning only the statuses relevant to
  // a given site, we need to match the statuses created by a specific
  // employer, as the withdrawl action creates two current statuses
  // simultaneously. One holds the siteID, the other holds the end date and
  // reason for withdrawal. We match them based on employerID.
  const employerIDs = participants
    .filter((participant) => participant.data?.previousData?.site === parseInt(siteID, 10))
    .map((participant) => participant.employer_id);

  return participants.filter(
    (participant) =>
      employerIDs.includes(participant.employer_id) &&
      participant.data.endDate !== undefined &&
      participant.data.type !== 'duplicate'
  );
};

const getParticipantByID = async (participantInfo) => {
  const participant = await dbClient.db[collections.PARTICIPANTS].findDoc({
    id: participantInfo.id,
  });
  return participant;
};

const createChangeHistory = (participantBody, changes) => {
  const newBody = { ...participantBody };
  const changeDetails = Object.keys(changes).reduce((target, key) => {
    target.push({
      field: key,
      from: participantBody[key] || 'none',
      to: changes[key],
    });
    return [...target];
  }, []);
  const newHistory = {
    timestamp: new Date(),
    changes: [...changeDetails],
  };
  newBody.history = participantBody.history
    ? [newHistory, ...participantBody.history]
    : [newHistory];
  return newBody;
};

const updateParticipant = async (participantInfo) => {
  // The below reduce function unpacks the most recent changes in the history
  // and builds them into an object to be used for the update request
  const changes = participantInfo.history[0].changes.reduce(
    (acc, change) => {
      const { field, to } = change;
      return { ...acc, [field]: to };
    },
    { history: participantInfo.history, userUpdatedAt: new Date().toJSON() }
  );
  const participant = await dbClient.db[collections.PARTICIPANTS].updateDoc(
    {
      id: participantInfo.id,
    },
    changes
  );

  return participant;
};

const withdrawParticipant = async (participantInfo) => {
  const participant = { ...participantInfo };
  const newHistory = {
    timestamp: new Date(),
    changes: [],
  };

  newHistory.changes.push({
    field: 'interested',
    from: participant.interested || 'yes',
    to: 'withdrawn',
  });
  participant.history = participant.history ? [newHistory, ...participant.history] : [newHistory];

  // eslint-disable-next-line no-use-before-define
  return updateParticipant(participant);
};

const validateConfirmationId = (id) =>
  dbClient.db[collections.CONFIRM_INTEREST].findOne({ otp: id });

const confirmParticipantInterest = async (id) => {
  const now = new Date().toJSON();
  // Check to see if there are any matching records that have not withdrawn.
  const relatedParticipants = await dbClient.db[collections.PARTICIPANTS]
    .join({
      [collections.CONFIRM_INTEREST]: {
        type: 'INNER',
        on: { email_address: 'body.emailAddress', otp: id },
      },
    })
    .find({
      'body.interested IS DISTINCT FROM': 'withdrawn', // "IS DISTINCT FROM" = "!=" but includes null
    });
  const hiredParticipants = await dbClient.db[collections.PARTICIPANTS]
    .join({
      [collections.PARTICIPANTS_STATUS]: {
        type: 'INNER',
        on: { participant_id: 'id' },
      },
    })
    .find({
      status: 'hired',
    });

  const hiredRelatedParticipants = relatedParticipants.filter((related) =>
    hiredParticipants.find((hired) => hired.id === related.id)
  );
  // Return false if any of the related participants is hired
  if (hiredRelatedParticipants.length > 0) {
    return false;
  }

  const updatedParticipantFields = relatedParticipants.map((participant) => {
    const changes = [
      {
        to: now,
        from: participant.body.userUpdatedAt,
        field: 'userUpdatedAt',
      },
    ];
    if (participant.interested !== 'yes') {
      changes.push({
        to: 'yes',
        from: participant.interested,
        field: 'interested',
      });
    }
    return {
      id: participant.id,
      userUpdatedAt: now,
      interested: 'yes',
      history: [
        {
          changes,
          timestamp: now,
          reason: 'Reconfirm Interest',
        },
        ...(participant.body.history ? participant.body.history : []),
      ],
    };
  });
  await Promise.all(
    updatedParticipantFields.map(({ id: participantId, ...fields }) => {
      const result = dbClient.db[collections.PARTICIPANTS].updateDoc({ id: participantId }, fields);
      return result;
    })
  );
  const deleted = await dbClient.db[collections.CONFIRM_INTEREST].destroy({ otp: id });
  // Fail if the OTP didn't exist or if the list of participants
  return deleted.length > 0 && updatedParticipantFields.length > 0;
};

const getParticipants = async (
  user,
  pagination,
  sortField,
  regionFilter,
  fsaFilter,
  lastNameFilter,
  emailFilter,
  siteSelector,
  statusFilters
) => {
  const participantsFinder = new ParticipantsFinder(dbClient, user);
  // While an employer, if we add 'open' as one of the status filters we won't
  // be able to filter lastName and emailAddress. The ideal way would be
  // creating one more AND/OR clausule to handle edge cases when we need to filter
  // lastName or email with statuses 'open' AND 'hired', for example. Setting this
  // as a TODO since there's no such case in the application yet.
  const filterLastNameAndEmail =
    user.isSuperUser ||
    user.isMoH ||
    ((user.isHA || user.isEmployer) && !statusFilters?.includes('open'));
  const interestFilter = (user.isHA || user.isEmployer) && statusFilters?.includes('open');
  const participants = await participantsFinder
    .filterRegion(regionFilter)
    .filterParticipantFields({
      postalCodeFsa: fsaFilter,
      lastName: filterLastNameAndEmail && lastNameFilter,
      emailAddress: filterLastNameAndEmail && emailFilter,
      interestFilter: interestFilter && ['no', 'withdrawn'],
    })
    .filterExternalFields({ statusFilters, siteIdDistance: siteSelector })
    .paginate(pagination, sortField)
    .run();
  const { table, criteria } = participantsFinder;
  const paginationData = pagination && {
    offset: (pagination.offset ? Number(pagination.offset) : 0) + participants.length,
    total: Number(await table.count(criteria || {})),
  };

  if (user.isSuperUser || user.isMoH) {
    return {
      data: participants.map((item) => {
        // Only return relevant fields
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
        if (total > 0)
          returnStatus = total === 1 ? 'In Progress' : `In Progress (${progressStats.total})`;
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
          distance: item.distance,
          progressStats,
        };
      }),
      ...(pagination && { pagination: paginationData }),
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
        distance: item.distance,
      };

      const hiredBySomeoneElseStatus = item.statusInfos?.find(
        (statusInfo) => statusInfo.status === 'hired' && statusInfo.employerId !== user.id
      );

      // Handling withdrawn and already hired, putting withdrawn as higher priority
      if (item.interested === 'withdrawn' || item.interested === 'no') {
        if (!participant.statusInfos) participant.statusInfos = [];
        participant.statusInfos.push({
          createdAt: new Date(),
          status: 'withdrawn',
        });
      } else if (hiredBySomeoneElseStatus) {
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
        const showContactInfo = participant.statusInfos.find((statusInfo) =>
          ['prospecting', 'interviewing', 'offer_made', 'hired'].includes(statusInfo.status)
        );
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
    ...(pagination && { pagination: paginationData }),
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

const makeParticipant = async (participantJson) => {
  const res = await dbClient.db.saveDoc(collections.PARTICIPANTS, participantJson);
  return res;
};

const createParticipantUserMap = async (userId, email, transaction) => {
  assert(email, 'Email must be a non empty string');
  const participants = await transaction[collections.PARTICIPANTS]
    .join({
      mapped: {
        type: 'LEFT OUTER',
        relation: collections.USER_PARTICIPANT_MAP,
        on: {
          participant_id: 'id',
          user_id: userId,
        },
      },
    })
    .find({
      'body.emailAddress ILIKE': email,
      'mapped.user_id': null,
    });

  // Return if no participant with email
  if (participants.length === 0) return [];
  await Promise.all(
    participants.map((participant) =>
      transaction[collections.USER_PARTICIPANT_MAP].save({
        user_id: userId,
        participant_id: participant.id,
      })
    )
  );
  return participants;
};

const getParticipantsForUser = async (userId, email) => {
  const finalResults = await dbClient.db.withTransaction(async (tnx) => {
    // Get all mapped participant
    const participants = await tnx[collections.PARTICIPANTS]
      .join({
        mapped: {
          type: 'LEFT OUTER',
          relation: collections.USER_PARTICIPANT_MAP,
          on: {
            participant_id: 'id',
            user_id: userId,
          },
        },
      })
      .find({
        'mapped.user_id': userId,
      });

    // Get all unmapped participant
    const newlyMappedParticipants = await createParticipantUserMap(userId, email, tnx);
    return [...participants, ...newlyMappedParticipants];
  });
  return finalResults.map((mappedParticipants) => ({
    ...mappedParticipants.body,
    id: mappedParticipants.id,
    submittedAt: mappedParticipants.created_at,
  }));
};

const mapUserWithParticipant = async (userId, participantId) =>
  dbClient.db[collections.USER_PARTICIPANT_MAP].save({
    user_id: userId,
    participant_id: participantId,
  });

const getParticipantByIdWithStatus = async ({ id, userId }) =>
  dbClient.db[collections.PARTICIPANTS]
    .join({
      currentStatuses: {
        type: 'LEFT OUTER',
        relation: collections.PARTICIPANTS_STATUS,
        on: {
          participant_id: 'id',
          current: true,
        },
      },
      user: {
        type: 'INNER',
        relation: collections.USER_PARTICIPANT_MAP,
        decomposeTo: 'object',
        on: {
          participant_id: 'id',
          user_id: userId,
        },
      },
    })
    .find({ id, 'user.user_id': userId });

const setParticipantLastUpdated = async (id) => {
  // Find participants
  let [participant] = await getParticipantByID({ id });
  // Don't change status if participant is withdrawn
  if (participant.interested !== 'withdrawn') {
    // Only change history if the interested column isn't yes
    if (participant.interested !== 'yes') {
      if (participant.history) {
        participant.history.push({
          to: 'yes',
          from: participant.interested,
          field: 'interested',
          timestamp: new Date(),
        });
      } else {
        participant.history = [
          {
            to: 'yes',
            from: participant.interested,
            field: 'interested',
            timestamp: new Date(),
          },
        ];
      }
    }
    participant = await dbClient.db[collections.PARTICIPANTS].updateDoc(
      {
        id,
      },
      {
        interested: 'yes',
        history: participant.history,
        userUpdatedAt: new Date().toJSON(),
      }
    );
  }
};

module.exports = {
  setParticipantLastUpdated,
  parseAndSaveParticipants,
  getParticipants,
  getHiredParticipantsBySite,
  getWithdrawnParticipantsBySite,
  getParticipantByID,
  updateParticipant,
  setParticipantStatus,
  makeParticipant,
  validateConfirmationId,
  confirmParticipantInterest,
  createParticipantUserMap,
  getParticipantsForUser,
  mapUserWithParticipant,
  getParticipantByIdWithStatus,
  withdrawParticipant,
  createChangeHistory,
};
