import { ParticipantStatus } from '../../constants';
import { dbClient, collections } from '../../db';

export const getParticipantHiredStatuses = async (participantId: number) => {
  const statuses = await dbClient.db[collections.PARTICIPANTS_STATUS].find({
    participant_id: participantId,
    status: ParticipantStatus.HIRED,
    current: true,
  });
  if (statuses.length === 0) {
    throw new Error('Participant is not hired');
  }
  return statuses;
};
