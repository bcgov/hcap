const { dbClient, collections } = require('../db');

const createGlobalPhase = async (phase, user) => {
  const phaseJson = { ...phase, created_by: user.id, updated_by: user.id };
  const res = await dbClient.db[collections.GLOBAL_PHASE].insert(phaseJson);
  return res;
};

module.exports = { createGlobalPhase };
