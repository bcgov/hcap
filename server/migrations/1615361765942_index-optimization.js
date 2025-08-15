const { collections } = require('../db');

exports.up = async (pgm) => {
  await pgm.createIndex(collections.PARTICIPANTS_STATUS, 'status');
  await pgm.createIndex(collections.PARTICIPANTS_STATUS, 'employer_id');
  await pgm.createIndex(collections.PARTICIPANTS_STATUS, 'participant_id');
  await pgm.createIndex(collections.PARTICIPANTS_STATUS, 'current', { where: 'current = true' });
};
