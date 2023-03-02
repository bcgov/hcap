import { dbClient, collections } from '../db';

export const waitlistHasEmail = async (email: string) => {
  const alreadyExists = await dbClient.db[collections.PARTICIPANT_WAITLIST].findOne({
    email,
  });
  return Boolean(alreadyExists);
};

export const addParticipantToWaitlist = async (email: string) => {
  if (await waitlistHasEmail(email)) {
    return false;
  }
  await dbClient.db[collections.PARTICIPANT_WAITLIST].save({
    email,
  });
  return true;
};
