/* eslint-disable camelcase */
import assert from 'assert';
import dayjs from 'dayjs';
import readXlsxFile from 'node-xlsx';
import { validate, ParticipantBatchSchema, isBooleanValue, postHireStatuses } from '../validation';
import { dbClient, collections } from '../db';
import { createRows, verifyHeaders } from '../utils';
import { ParticipantsFinder } from './participants-helper';
import type { Pagination } from './participants-helper';
import logger from '../logger';
import { getAssignCohort } from './cohorts';
import { createPostHireStatus, getPostHireStatusesForParticipant } from './post-hire-flow';

export const deleteParticipant = async ({ email }) => {
  await dbClient.db.withTransaction(async (tnx) => {
    // Delete entry from participant-user-map
    await tnx.query(
      `
      DELETE FROM ${collections.USER_PARTICIPANT_MAP} 
      WHERE participant_id IN
      ( SELECT id FROM ${collections.PARTICIPANTS} 
        WHERE LOWER(body->>'emailAddress') = LOWER($1)
      );`,
      [email]
    );
    // Delete actual entry
    await tnx[collections.PARTICIPANTS].destroy({
      'body.emailAddress': email,
    });
  });
};

export const invalidateStatus = async ({ currentStatusId }) =>
  dbClient.db[collections.PARTICIPANTS_STATUS].update(
    {
      id: currentStatusId,
    },
    {
      current: false,
    }
  );

export const deleteAcknowledgement = async (participantId) =>
  dbClient.db.withTransaction(async (tx) => {
    const item = await tx[collections.PARTICIPANTS_STATUS].findOne({
      participant_id: participantId,
      status: 'pending_acknowledgement',
      current: true,
    });
    if (!item) {
      return { success: false, message: 'No pending acknowledgement found' };
    }
    await tx[collections.PARTICIPANTS_STATUS].update(
      {
        id: item.id,
      },
      { current: false }
    );
    return { success: true, message: 'Participant status acknowledged and closed' };
  });

export const getHiredParticipantsBySite = async (siteID) => {
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

/**
 * Complexity in this function relates to withdrawal reason being stored in a record separate
 * from the participant's site.
 *
 * 1. Find previously hired participants for a site
 * 2. Get list of archived candidates with IDs that match previously hired participants
 *
 * @param {string} siteID
 * @returns list of withdrawn participants+status related to a given siteID
 */
export const getWithdrawnParticipantsBySite = async (siteID) => {
  const participantsStatusJoin = dbClient.db[collections.PARTICIPANTS_STATUS].join({
    participantJoin: {
      type: 'LEFT OUTER',
      relation: collections.PARTICIPANTS,
      decomposeTo: 'object',
      on: { id: 'participant_id' },
    },
  });

  // List of previously hired participants associated with the given SiteID
  // Looking for (current = false) to reduce the list (we aren't looking for currently hired records)
  const hiredParticipants = await participantsStatusJoin.find({
    status: 'hired',
    current: false,
    'data.site': siteID,
  });

  // Query for archived, non-duplicate participants using the previous list
  const withdrawnParticipants = await participantsStatusJoin.find({
    'participant_id IN': hiredParticipants.map((participant) => participant.participant_id),
    status: 'archived',
    current: true,
    'data.type !=': 'duplicate',
  });

  return withdrawnParticipants;
};

export const getParticipantByID = async (id) => {
  const participant = await dbClient.db[collections.PARTICIPANTS].findDoc({
    id,
  });
  return participant;
};

export const createChangeHistory = (participantBody, changes) => {
  try {
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
    newBody.history =
      participantBody.history && participantBody.history.constructor === Array
        ? [newHistory, ...participantBody.history]
        : [newHistory];
    return newBody;
  } catch (e) {
    logger.error(`createChangeHistory: fail to create change history: ${e}`);
    throw e;
  }
};

export const updateParticipant = async (participantInfo) => {
  try {
    // The below reduce function unpacks the most recent changes in the history
    // and builds them into an object to be used for the update request
    const changes = participantInfo.history[0].changes.reduce(
      (acc, change) => {
        const { field, to } = change;
        return { ...acc, [field]: to };
      },
      { history: participantInfo.history || [], userUpdatedAt: new Date().toJSON() }
    );
    if (changes.interested === 'withdrawn') {
      const cohort = await getAssignCohort({ participantId: participantInfo.id });
      // Get All existing status
      const statuses = await getPostHireStatusesForParticipant({
        participantId: participantInfo.id,
      });
      const graduationStatuses = statuses.filter(
        (item) =>
          item.status === postHireStatuses.postSecondaryEducationCompleted ||
          item.status === postHireStatuses.cohortUnsuccessful
      );
      // ensure that a participant has a cohort before adding post hire status
      if (cohort && cohort.length > 0 && graduationStatuses.length === 0) {
        await createPostHireStatus({
          participantId: participantInfo.id,
          status: postHireStatuses.cohortUnsuccessful,
          data: {
            unsuccessfulCohortDate: dayjs().format('YYYY/MM/DD'),
          },
        });
      }
    }
    const participant = await dbClient.db[collections.PARTICIPANTS].updateDoc(
      {
        id: participantInfo.id,
      },
      changes
    );

    return participant;
  } catch (error) {
    logger.error(`updateParticipant: fail to update participant: ${error}`);
    throw error;
  }
};

export const withdrawParticipant = async (participantInfo) => {
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

export const archiveParticipantBySite = async (siteId, participantId, data, userId) => {
  const hiredParticipants = await getHiredParticipantsBySite(siteId);
  if (!hiredParticipants) {
    return false;
  }
  const chosenOne = hiredParticipants.find(
    (hiredParticipant) => hiredParticipant.participant_id === participantId
  );
  if (!chosenOne) {
    return false;
  }

  await dbClient.db.withTransaction(async (tx) => {
    // Invalidate the old status
    await tx[collections.PARTICIPANTS_STATUS].update(
      {
        id: chosenOne.id,
      },
      { current: false }
    );
    // Save new status
    await tx[collections.PARTICIPANTS_STATUS].save({
      employer_id: chosenOne.employer_id,
      participant_id: participantId,
      status: 'archived',
      current: true,
      data,
    });
    // Only create pending acknowledgment status if it's a different person making the request.
    if (chosenOne.employer_id !== userId) {
      // Add an ephemeral status to warn the employer
      await tx[collections.PARTICIPANTS_STATUS].save({
        employer_id: chosenOne.employer_id,
        participant_id: participantId,
        status: 'pending_acknowledgement',
        current: true,
        data,
      });
    }
    // Get the full participant record of the user and withdraw that user.
    const participant = await tx[collections.PARTICIPANTS].findDoc({
      id: participantId,
    });
    await withdrawParticipant(participant[0]);
  });
  return true;
};

export const validateConfirmationId = (id) =>
  dbClient.db[collections.CONFIRM_INTEREST].findOne({ otp: id });

export const confirmParticipantInterest = async (id) => {
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

export const getParticipants = async (
  user,
  pagination: Pagination,
  sortField,
  regionFilter,
  fsaFilter,
  lastNameFilter,
  emailFilter,
  siteSelector,
  statusFilters,
  isIndigenousFilter
) => {
  // Get user ids
  const participantsFinder = new ParticipantsFinder(dbClient, user);
  const interestFilter = (user.isHA || user.isEmployer) && statusFilters?.includes('open');
  let participants = await participantsFinder
    .filterRegion(regionFilter)
    .filterParticipantFields({
      postalCodeFsa: fsaFilter,
      lastName: lastNameFilter,
      emailAddress: emailFilter,
      interestFilter: interestFilter && ['no', 'withdrawn'],
      isIndigenousFilter,
    })
    .filterExternalFields({
      statusFilters,
      siteIdDistance: siteSelector,
    })
    .paginate(pagination, sortField)
    .run();
  const { table, criteria } = participantsFinder;
  const paginationData = pagination && {
    offset: (pagination.offset ? Number(pagination.offset) : 0) + participants.length,
    total: Number(await table.count(criteria || {})),
  };

  // HCAP:1030: Get participants post-hire statuses
  participants = await Promise.all(
    participants.map(async (participant) => {
      const statuses = await getPostHireStatusesForParticipant({ participantId: participant.id });
      return {
        ...participant,
        postHireStatuses: statuses || [],
      };
    })
  );

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
          postHireStatuses: item.postHireStatuses || [],
          rosStatuses: item.rosStatuses || [],
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
        postHireStatuses: item.postHireStatuses || [],
        rosStatuses: item.rosStatuses || [],
        statusInfos: undefined, // This gets set later. Should probably get stronger typing.
        phoneNumber: undefined,
        emailAddress: undefined,
      };

      // Get hired status
      const hiredStatus = item.statusInfos?.find((statusInfo) => statusInfo.status === 'hired');
      const hiredForAssociatedSites = hiredStatus && user.sites.includes(hiredStatus?.data.site);

      // Current Status
      const currentStatusInfo = item.statusInfos[0] || {};
      const currentStatusInProgress = !['hired', 'archived'].includes(currentStatusInfo.status);
      // The participant is hired in a site which is not associated with user
      const hiredByOtherOrg = hiredStatus && !hiredForAssociatedSites;
      // The participant is hired by some other user but site associated by user
      const hiredBySomeoneInSameOrgStatus =
        hiredStatus &&
        hiredForAssociatedSites &&
        hiredStatus.employerId !== user.id &&
        currentStatusInProgress;
      // Hired by same user but different site
      const hiredForOtherSite =
        hiredStatus &&
        hiredForAssociatedSites &&
        currentStatusInfo.data?.site !== hiredStatus.data.site &&
        !['hired', 'archived'].includes(currentStatusInfo.status) &&
        hiredStatus.employerId === user.id;

      // Archived by org
      const archivedByOrgStatus = item.statusInfos?.find(
        (statusInfo) => statusInfo.status === 'archived' && statusInfo.employerId !== user.id
      );

      // Handling withdrawn and already hired, putting withdrawn as higher priority
      let computedStatus;
      if (item.interested === 'withdrawn' || item.interested === 'no') {
        computedStatus = {
          createdAt: new Date(),
          status: 'withdrawn',
        };
      } else if (hiredByOtherOrg) {
        computedStatus = {
          createdAt: hiredStatus.createdAt,
          status: 'already_hired',
        };
      } else if (hiredBySomeoneInSameOrgStatus || hiredForOtherSite) {
        computedStatus = {
          createdAt: hiredStatus.createdAt,
          status: 'hired_by_peer',
        };
      } else if (archivedByOrgStatus) {
        computedStatus = archivedByOrgStatus;
      }

      if (computedStatus) {
        participant.statusInfos = participant.statusInfos
          ? [...participant.statusInfos, computedStatus]
          : [computedStatus];
      }

      const statusInfos = item.statusInfos?.find(
        (statusInfo) =>
          statusInfo.employerId === user.id ||
          (statusInfo.data && user.sites?.includes(statusInfo.data.site))
      );

      if (statusInfos) {
        if (!participant.statusInfos) participant.statusInfos = [];

        participant.statusInfos.unshift(statusInfos);
        const showContactInfo = participant.statusInfos.find((statusInfo) =>
          ['prospecting', 'interviewing', 'offer_made', 'hired'].includes(statusInfo.status)
        );
        if (showContactInfo && !hiredByOtherOrg) {
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

export const makeParticipant = async (participantJson) => {
  const res = await dbClient.db.saveDoc(collections.PARTICIPANTS, participantJson);
  return res;
};

export const createParticipantUserMap = async (userId, email, transaction) => {
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

export const getParticipantsForUser = async (userId, email) => {
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
        hired: {
          type: 'LEFT OUTER',
          relation: collections.PARTICIPANTS_STATUS,
          on: {
            participant_id: 'id',
            current: true,
            status: 'hired',
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
    hired: mappedParticipants.hired,
  }));
};

export const mapUserWithParticipant = async (userId, participantId) =>
  dbClient.db[collections.USER_PARTICIPANT_MAP].save({
    user_id: userId,
    participant_id: participantId,
  });

export const getParticipantByIdWithStatus = async ({ id, userId }) =>
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

export const setParticipantLastUpdated = async (id) => {
  // Find participants
  let [participant] = await getParticipantByID(id);
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

export const withdrawParticipantsByEmail = async (userId, email) => {
  if (!email) {
    return;
  }
  await dbClient.db.withTransaction(async (tx) => {
    const participants = await getParticipantsForUser(userId, email);
    await participants.forEach(async (participant) => {
      if (participant.interested === 'withdrawn' || participant?.hired?.length) {
        return;
      }
      const historyObj = {
        to: 'withdrawn',
        from: participant.interested,
        field: 'interested',
        timestamp: new Date().toJSON(),
        note: 'Withdrawn by participant',
      };
      const newHistory =
        participant.history && participant.history.push
          ? participant.history.push(historyObj)
          : [historyObj];
      await tx[collections.PARTICIPANTS].updateDoc(
        { id: participant.id },
        {
          history: newHistory,
          interested: 'withdrawn',
          userUpdatedAt: new Date().toJSON(),
        }
      );
    });
  });
};
