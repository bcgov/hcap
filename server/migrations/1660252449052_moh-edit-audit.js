/* eslint-disable camelcase */
const { collections } = require('../db');

exports.shorthands = 'moh_edit_audit';

exports.up = async (pgm) => {
  await pgm.createTable(collections.MOH_EDIT_AUDIT, {
    id: 'id',
    user: { type: 'varchar(255)', notNull: true },
    data: { type: 'jsonb', notNull: true },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
};

exports.down = async (pgm) => {
  await pgm.dropTable(collections.MOH_EDIT_AUDIT, { ifExists: true });
};
