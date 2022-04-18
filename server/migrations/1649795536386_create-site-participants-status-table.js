/* eslint-disable camelcase */
const { collections } = require('../db');

exports.shorthands = collections.SITE_PARTICIPANTS_STATUS;

exports.up = async (pgm) => {
  await pgm.createTable(collections.SITE_PARTICIPANTS_STATUS, {
    id: 'id',
    site_id: {
      type: 'integer',
      notNull: true,
      references: collections.EMPLOYER_SITES,
      onDelete: 'cascade',
    },
    participant_status_id: {
      type: 'integer',
      notNull: true,
      references: collections.PARTICIPANTS_STATUS,
      onDelete: 'no action',
    },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
};

exports.down = async (pgm) => {
  await pgm.dropTable(collections.SITE_PARTICIPANTS_STATUS, { ifExists: true });
};
