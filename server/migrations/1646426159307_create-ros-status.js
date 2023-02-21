/* eslint-disable camelcase */
import { collections } from '../db';

exports.shorthands = 'return_of_service_status';

exports.up = async (pgm) => {
  await pgm.createTable(collections.ROS_STATUS, {
    id: 'id',
    participant_id: {
      type: 'integer',
      notNull: true,
      references: collections.PARTICIPANTS,
      onDelete: 'cascade',
    },
    status: { type: 'varchar(255)', notNull: true },
    data: { type: 'jsonb', notNull: true },
    site_id: {
      type: 'integer',
      notNull: true,
      references: collections.EMPLOYER_SITES,
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
  await pgm.dropTable(collections.ROS_STATUS, { ifExists: true });
};
