/* eslint-disable camelcase */

import { collections } from '../db';

exports.shorthands = 'add_created_at_date_for_cohort';

exports.up = (pgm) => {
  pgm.addColumns(
    collections.COHORT_PARTICIPANTS,
    {
      created_at: {
        type: 'timestamp with time zone',
        notNull: true,
        default: pgm.func('current_timestamp'),
      },
      is_current: {
        type: 'boolean',
        notNull: true,
        default: true,
      },
    },
    { ifNotExists: true }
  );
};

exports.down = (pgm) => {
  pgm.dropColumns(collections.COHORT_PARTICIPANTS, ['created_at', 'is_current'], {
    ifExists: true,
  });
};
