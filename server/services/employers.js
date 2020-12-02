const { dbClient, collections } = require('../db');
const { userRegionQuery } = require('./user.js');

const getEmployers = async (user) => {
  const criteria = user.isSuperUser || user.isMoH ? {} : userRegionQuery(user.regions, 'healthAuthority');
  return criteria
    ? dbClient.db[collections.EMPLOYER_FORMS].findDoc(criteria)
    : [];
};

module.exports = { getEmployers };
