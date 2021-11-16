/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = async (pgm) => {
  await pgm.createTable('waitlist', {
    id: 'id',
    email: { type: 'varchar(200)', notNull: true, unique: true },
    createdAt: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });
};

exports.down = async (pgm) => {
  await pgm.dropTable('waitlist', { ifExists: true });
};
