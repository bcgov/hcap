/* eslint-disable camelcase */

exports.up = (pgm) => {
  pgm.renameTable('applicants', 'participants');
};
