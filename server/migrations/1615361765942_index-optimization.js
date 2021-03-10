const { collections } = require('../db/schema.js');

exports.up = async (pgm) => {
  await pgm.createIndex(collections.PARTICIPANTS_STATUS, 'status');
  await pgm.createIndex(collections.PARTICIPANTS_STATUS, 'employer_id');
  await pgm.createIndex(collections.PARTICIPANTS_STATUS, 'participant_id');
  await pgm.createIndex(collections.PARTICIPANTS_STATUS, 'current', { where: 'current = true' });
  await pgm.createExtension('pg_trgm', { ifNotExists: true });
  await pgm.createIndex(collections.PARTICIPANTS, [{ name: "(body->>'preferredLocation')", opclass: { name: 'gin_trgm_ops' } }], { method: 'gin' });
};
