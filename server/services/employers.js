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


const getAllSites = async () =>
  dbClient.db[collections.EMPLOYER_SITES].findDoc(
    {},
    {
      order: [
        {
          field: 'body.siteName',
        },
      ],
    }
  );

const getSitesWithCriteria = async (additionalCriteria, additionalCriteriaParams) => {
  // Raw SQL was required here because `options.fields` wouldn't work with `join` https://github.com/bcgov/hcap/pull/834#pullrequestreview-1100927873
  const records = await dbClient.db.query(
    `
      SELECT
        es.id as "id",
        es.body -> 'siteId' as "siteId",
        es.body -> 'siteName' as "siteName",
        es.body -> 'operatorName' as "operatorName",
        es.body -> 'city' as "city",
        es.body -> 'healthAuthority' as "healthAuthority",
        es.body -> 'postalCode' as "postalCode",
        spa.allocation,
        p.start_date as "startDate", 
        p.end_date as "endDate"
      FROM
        employer_sites es
      LEFT JOIN site_phase_allocation spa on spa.site_id = es.id 
      LEFT JOIN phase p on p.id = spa.phase_id
      AND CURRENT_DATE between p.start_date and p.end_date
      ${additionalCriteria.length > 0 ? 'WHERE' : ''}
        ${additionalCriteria.join(' AND ')}
      ORDER BY
        es.body -> 'siteName';
    `,
    additionalCriteriaParams
  );

  return records;
};

/**
 * Get all accessible sites for a user
 * @param {*} user user with roles and sites to filter
 * @returns list of sites which the user has access to
 */
const getSitesForUser = async (user) => {
  const additionalCriteria = [];
  const additionalCriteriaParams = {};

  if ((user.isHA || user.isEmployer) && user.sites.length > 0) {
    additionalCriteria.push(`(employer_sites.body ->> 'siteId')::INT IN ($(userSites:csv))`);
    additionalCriteriaParams.userSites = user.sites;
  }

  if (user.isHA && user.regions.length > 0) {
    additionalCriteria.push(`employer_sites.body ->> 'healthAuthority' IN ($(userRegions:csv))`);
    additionalCriteriaParams.userRegions = user.regions;
  }
  return getSitesWithCriteria(additionalCriteria, additionalCriteriaParams);
};

/**
 * Get all sites for regions, returning nothing if there's no regions passed in
 * @param {*} regions regions to get sites for
 * @returns list of sites within a region
 */
const getSitesForRegion = async (regions) => {
  if (regions.length > 0) {
    const additionalCriteria = [];
    const additionalCriteriaParams = {};

    additionalCriteria.push(`employer_sites.body ->> 'healthAuthority' IN ($(userRegions:csv))`);
    additionalCriteriaParams.userRegions = regions;
    return getSitesWithCriteria(additionalCriteria, additionalCriteriaParams);
  }
  return [];
};

const getSiteDetailsById = async (id) => {
  const site = await dbClient.db[collections.EMPLOYER_SITES].findDoc({ id });
  if (site.length === 0) {
    return [{ error: `No site found with id` }];
  }
  return site;
};

const getSiteByID = async (id) => {
  const site = await dbClient.db[collections.EMPLOYER_SITES].findDoc({ id });
  if (site.length === 0) {
    return [{ error: `No site found with id` }];
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
  getSitesForUser,
  getSitesForRegion,
  getAllSites,
  getSiteByID,
  getSiteDetailsById,
};
