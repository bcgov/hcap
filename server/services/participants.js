const { getUserRoles, getUserRegionsCriteria } = require('./user.js');
const { dbClient, collections } = require('../db');

const getParticipants = async (req) => {
  const roles = getUserRoles(req);
  const isMOH = roles.includes('ministry_of_health');
  const isSuperUser = roles.includes('superuser');
  const criteria = isSuperUser || isMOH ? {} : getUserRegionsCriteria(req, 'preferredLocation');
  const participants = criteria ? await dbClient.db[collections.APPLICANTS].findDoc(criteria) : [];

  if (isSuperUser) {
    return participants;
  }

  if (isMOH) {
    return participants.map((item) => ({
      id: item.id,
      firstName: item.firstName,
      lastName: item.lastName,
      postalCode: item.postalCode,
      preferredLocation: item.preferredLocation,
      city: item.city,
      phoneNumber: item.phoneNumber,
      emailAddress: item.emailAddress,
      criminalRecordCheck: item.criminalRecordCheck,
    }));
  }

  return participants.map((item) => ({
    id: item.id,
    firstName: item.firstName,
    lastName: item.lastName,
    postalCode: item.postalCode,
    preferredLocation: item.preferredLocation,
  }));
};

module.exports = { getParticipants };
