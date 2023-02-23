/* eslint-disable camelcase */
// disabling camelcase check so that we can manipulate snake_case attributes without changing structure
const { dbClient, collections } = require('../db');

/**
 * Gets all phases for a site
 * @param {number} siteId PK ID of the site
 * @param {number} phaseId PK ID of the phase
 */
export const getAllocation = async (siteId, phaseId) => {
  /**
   * @typedef {Object} allocationResponse  type for DB response to the `getAllocation` query
   * @property {number} id                 PK ID of the allocation
   * @property {number} phase_id           FK for phase
   * @property {number} allocation         Number of allocations available
   * @property {number} site_id            FK for employer_site
   * */

  /**
   * @type {allocationResponse}
   * */
  const allocation = await dbClient.db[collections.SITE_PHASE_ALLOCATION].findOne({
    site_id: siteId,
    phase_id: phaseId,
  });

  return allocation;
};

export const createAllocation = async (allocation, user) => {
  const data = { ...allocation, created_by: user.id, updated_by: user.id };
  const res = await dbClient.db[collections.SITE_PHASE_ALLOCATION].insert(data);
  return res;
};

export const updateAllocation = async (allocationId, allocation, user) => {
  const data = { ...allocation, updated_by: user.id };
  const res = await dbClient.db[collections.SITE_PHASE_ALLOCATION].update(allocationId, data);
  return res;
};
