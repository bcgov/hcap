/* eslint-disable no-restricted-syntax, no-await-in-loop */

exports.up = async (pgm) => {
  await pgm.addColumns('participants_status', { data: 'jsonb' }, { ifNotExists: true });
};
