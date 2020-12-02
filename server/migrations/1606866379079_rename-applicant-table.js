/* eslint-disable camelcase */

exports.up = async (pgm) => {
  const applicantsExists = await pgm.db.query('SELECT \'public.applicants\'::regclass');
  if (applicantsExists) {
    pgm.renameTable('applicants', 'participants');
  }
};
