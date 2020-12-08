const { dbClient, collections } = require('../db');
const { validate, EmployerSiteBatchSchema } = require('../validation');
const { userRegionQuery } = require('./user.js');

const getEmployers = async (user) => {
  const criteria = user.isSuperUser || user.isMoH ? {} : userRegionQuery(user.regions, 'healthAuthority');
  return criteria
    ? dbClient.db[collections.EMPLOYER_FORMS].findDoc(criteria)
    : [];
};

const saveSites = async (sitesArg) => {
  const sites = Array.isArray(sitesArg) ? sitesArg : [sitesArg];
  await validate(EmployerSiteBatchSchema, sites);
  const promises = sites.map((site) => dbClient.db.saveDoc(collections.EMPLOYER_SITES, site));
  const results = await Promise.allSettled(promises);
  const response = [];
  results.forEach((result, index) => {
    const { siteId } = sites[index];
    switch (result.status) {
      case 'fulfilled':
        response.push({ siteId, status: 'Success' });
        break;
      default:
        if (result.reason.code === '23505') {
          response.push({ siteId, status: 'Duplicate' });
        } else {
          response.push({ siteId, status: 'Error', message: result.reason });
        }
    }
  });
  return response;
};

const getSites = async () => dbClient.db[collections.EMPLOYER_SITES].findDoc({});

module.exports = { getEmployers, saveSites, getSites };
