const { dbClient, collections } = require('../db');

const createGlobalPhase = async (phaseJson) => {
  const res = await dbClient.db[collections.GLOBAL_PHASE].insert(phaseJson);
  return res;
};

module.exports = { createGlobalPhase };
