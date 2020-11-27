const { getUserRoles, getUserRegionsCriteria } = require('./user.js');
const { dbClient, collections } = require('../db');

const getEmployers = async (req) => {
  const roles = getUserRoles(req);
  const isMOH = roles.includes('ministry_of_health');
  const isSuperUser = roles.includes('superuser');
  const criteria = isSuperUser || isMOH ? {} : getUserRegionsCriteria(req, 'healthAuthority');
  return criteria
    ? dbClient.db[collections.EMPLOYER_FORMS].findDoc(criteria)
    : [];
};

module.exports = { getEmployers };
