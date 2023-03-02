import assert from 'assert';
import { dbClient, collections } from '../../db';

export const mapUserWithParticipant = async (userId: string, participantId) =>
  dbClient.db[collections.USER_PARTICIPANT_MAP].save({
    user_id: userId,
    participant_id: participantId,
  });

export const createParticipantUserMap = async (userId: string, email: string, transaction) => {
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

export const getParticipantsForUser = async (userId: string, email: string) => {
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

export const withdrawParticipantsByEmail = async (userId: string, email: string) => {
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
