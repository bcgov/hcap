import { dbClient, collections } from '../../db';
import { withdrawParticipant } from './participant-single';

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
