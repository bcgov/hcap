const { dbClient, collections } = require('../db');

const getAllSitePhases = async (siteId) => {
  const sitePhases = await dbClient.db[collections.GLOBAL_PHASE]
    .join({
      [collections.SITE_PHASE_ALLOCATION]: {
        type: 'LEFT OUTER',
        relation: collections.SITE_PHASE_ALLOCATION,
        on: {
          phase_id: 'id',
          site_id: siteId,
        },
      },
    })
    .find({});
  return sitePhases;
};

const getAllGlobalPhases = async () => dbClient.db[collections.GLOBAL_PHASE].findDoc({});

const createGlobalPhase = async (phase, user) => {
  // TODO: this should create a site_phase_allocation for each site probably
  const phaseJson = { ...phase, created_by: user.id, updated_by: user.id };
  const res = await dbClient.db[collections.GLOBAL_PHASE].insert(phaseJson);
  return res;
};

module.exports = { createGlobalPhase, getAllSitePhases, getAllGlobalPhases };
