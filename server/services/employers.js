const { dbClient, collections } = require('../db');
const { validate, EmployerSiteBatchSchema } = require('../validation');
const { userRegionQuery } = require('./user.js');

const getEmployers = async (user) => {
  const criteria =
    user.isSuperUser || user.isMoH ? {} : userRegionQuery(user.regions, 'healthAuthority');
  return criteria ? dbClient.db[collections.EMPLOYER_FORMS].findDoc(criteria) : [];
};

const getEmployerByID = async (id) => dbClient.db[collections.EMPLOYER_FORMS].findDoc({ id });

const saveSingleSite = async (siteJson) => {
  const res = await dbClient.db.saveDoc(collections.EMPLOYER_SITES, siteJson);
  return res;
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

const updateSite = async (id, site) => {
  const changes = site.history[0].changes.reduce(
    (acc, change) => {
      const { field, to } = change;
      return { ...acc, [field]: to };
    },
    { history: site.history, userUpdatedAt: new Date().toJSON() }
  );

  return dbClient.db[collections.EMPLOYER_SITES].updateDoc({ id }, changes);
};

const getSites = async () => dbClient.db[collections.EMPLOYER_SITES].findDoc({});
const getSiteByID = async (id) => {
  const site = await dbClient.db[collections.EMPLOYER_SITES].findDoc({ id });
  if (site.length === 0) {
    return [{ error: `No site found with id ${id}` }];
  }

  // Counting hire
  // Join Criteria for duplicate participant
  const duplicateArchivedJoin = {
    type: 'LEFT OUTER',
    relation: collections.PARTICIPANTS_STATUS,
    on: {
      participant_id: 'participant_id',
      status: 'archived',
      current: true,
      'data.type': 'duplicate',
    },
  };
  const hcapHires = await dbClient.db[collections.PARTICIPANTS_STATUS]
    .join({
      duplicateArchivedJoin,
    })
    .count({
      'data.site': site[0].siteId,
      'data.nonHcapOpportunity': 'false',
      'duplicateArchivedJoin.status': null,
    });
  const nonHcapHires = await dbClient.db[collections.PARTICIPANTS_STATUS]
    .join({
      duplicateArchivedJoin,
    })
    .count({
      'data.site': site[0].siteId,
      'data.nonHcapOpportunity': 'true',
      'duplicateArchivedJoin.status': null,
    });
  site[0].hcapHires = hcapHires;
  site[0].nonHcapHires = nonHcapHires;
  return site;
};

module.exports = {
  getEmployers,
  getEmployerByID,
  saveSingleSite,
  saveSites,
  updateSite,
  getSites,
  getSiteByID,
};
