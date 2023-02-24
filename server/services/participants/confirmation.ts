import { dbClient, collections } from '../../db';

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
