const { dbClient, collections } = require('../db');
const waitlistHasEmail = async (email) => {
  const alreadyExists = await dbClient.db[collections.WAITLIST].findOne({
    email,
  });
  return Boolean(alreadyExists);
};

const addParticipantToWaitlist = async (email) => {
  if (await waitlistHasEmail(email)) {
    return false;
  }
  await dbClient.db[collections.WAITLIST].save({
    email,
  });
  return true;
};
module.exports = {
  addParticipantToWaitlist,
  waitlistHasEmail,
};
