/* eslint-disable camelcase */

const ERROR_UNIDENTIFIED_TABLE = '42P01';

exports.up = async (pgm) => {
  try {
    const participantsExists = await pgm.db.query('SELECT \'public.participants\'::regclass');
    if (participantsExists) return;

    const applicantsExists = await pgm.db.query('SELECT \'public.applicants\'::regclass');
    if (applicantsExists) {
      pgm.renameTable('applicants', 'participants');
    }
  } catch (error) {
    if (error.code !== ERROR_UNIDENTIFIED_TABLE) {
      throw error;
    }
  }
};
