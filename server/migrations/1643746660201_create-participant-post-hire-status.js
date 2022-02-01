/* eslint-disable camelcase */
const { collections } = require('../db');

exports.shorthands = undefined;

exports.up = async (pgm) => {
  await pgm.createTable(collections.PARTICIPANT_POST_HIRE_STATUS, {
    id: 'id',
    participant_id: {
      type: 'integer',
      notNull: true,
      references: collections.PARTICIPANTS,
      onDelete: 'cascade',
    },
    status: { type: 'varchar(255)', notNull: true },
    data: { type: 'jsonb', notNull: true },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
};

exports.down = async (pgm) => {
  await pgm.dropTable(collections.PARTICIPANT_POST_HIRE_STATUS, { ifExists: true });
};
