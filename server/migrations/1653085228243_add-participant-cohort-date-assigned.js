/* eslint-disable camelcase */

exports.shorthands = undefined;

exports.up = (pgm) => {
  pgm.addColumns(
    'cohort_participants',
    {
      date_assigned: {
        type: 'timestamp with time zone',
        default: pgm.func('now()'),
      },
    },
    { ifNotExists: true }
  );
};

exports.down = (pgm) => {
  pgm.dropColumns('cohort_participants', ['date_assigned'], { ifExists: true });
};
