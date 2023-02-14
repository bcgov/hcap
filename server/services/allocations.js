/* eslint-disable camelcase */
// disabling camelcase check so that we can manipulate snake_case attributes without changing structure
const { dbClient, collections } = require('../db');

/**
 *
 * @typedef  {Object} allocation
 * @property {number} id             Internal ID of the allocation
 * @property {string} phase_id      FK for phase
 * @property {number} allocation    Number of allocations available
 * @property {number} site_id       FK for employer_site
 */

const getPhaseAllocation = async (siteId, phaseId) => {
  const allocation = await dbClient.db[collections.SITE_PHASE_ALLOCATION].findOne(
    {
      site_id: siteId,
      phase_id: phaseId,
    },
    { limit: 1 }
  );

  return allocation;
};

const createPhaseAllocation = async (allocation, user) => {
  const data = { ...allocation, created_by: user.id, updated_by: user.id };
  const res = await dbClient.db[collections.SITE_PHASE_ALLOCATION].insert(data);
  return res;
};

const updatePhaseAllocation = async (allocationId, allocation, user) => {
  const data = { ...allocation, updated_by: user.id };
  const res = await dbClient.db[collections.SITE_PHASE_ALLOCATION].update(allocationId, data);
  return res;
};

module.exports = {
  getPhaseAllocation,
  createPhaseAllocation,
  updatePhaseAllocation,
};
