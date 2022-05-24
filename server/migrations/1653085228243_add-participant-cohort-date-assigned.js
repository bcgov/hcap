/* eslint-disable camelcase */

exports.shorthands = 'add_created_at_date_for_cohort';

exports.up = (pgm) => {
  pgm.addColumns(
    'cohort_participants',
    {
      created_at: {
        type: 'timestamp with time zone',
        notNull: true,
        default: pgm.func('current_timestamp'),
      },
    },
    { ifNotExists: true }
  );
};

exports.down = (pgm) => {
  pgm.dropColumns('cohort_participants', ['created_at'], { ifExists: true });
};
