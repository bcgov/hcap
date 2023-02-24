import dayjs from 'dayjs';
import { dbClient, collections } from '../../db';
import { postHireStatuses } from '../../validation';
import { getAssignCohort } from '../cohorts';
import { createPostHireStatus, getPostHireStatusesForParticipant } from '../post-hire-flow';
import logger from '../../logger';

export const makeParticipant = async (participantData) => {
  const res = await dbClient.db.saveDoc(collections.PARTICIPANTS, participantData);
  return res;
};

export const getParticipantByID = async (id) => {
  const participant = await dbClient.db[collections.PARTICIPANTS].findDoc({
    id,
  });
  return participant;
};

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
