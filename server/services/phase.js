const { dbClient, collections } = require('../db');

const createGlobalPhase = async (phaseJson) => {
  const res = await dbClient.db.saveDoc(collections.GLOBAL_PHASE, phaseJson);
  return res;
};

module.exports = { createGlobalPhase };
