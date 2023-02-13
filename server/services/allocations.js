/* eslint-disable camelcase */
// disabling camelcase check so that we can manipulate snake_case attributes without changing structure
const dayjs = require('dayjs');
const isBetween = require('dayjs/plugin/isBetween');
const { dbClient, collections } = require('../db');

dayjs.extend(isBetween);

const getPhaseAllocation = async (siteId, phaseId) => {
  const allocation = await dbClient.db[collections.SITE_PHASE_ALLOCATION].find(
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
