import { dbClient, collections } from '../../db';

export const deleteAcknowledgement = async (participantId: number) =>
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
