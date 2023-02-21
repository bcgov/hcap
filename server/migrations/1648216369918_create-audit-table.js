/* eslint-disable camelcase */
import { collections } from '../db';

exports.shorthands = 'admin_operation_audit';

exports.up = async (pgm) => {
  await pgm.createTable(collections.ADMIN_OPS_AUDIT, {
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
  await pgm.dropTable(collections.ADMIN_OPS_AUDIT, { ifExists: true });
};
