/* eslint-disable camelcase */

import { collections } from '../db';

exports.shorthands = 'add_is_current_post_hire_status';

exports.up = (pgm) => {
  pgm.addColumns(
    collections.PARTICIPANT_POST_HIRE_STATUS,
    {
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
  pgm.dropColumns(collections.PARTICIPANT_POST_HIRE_STATUS, ['is_current'], {
    ifExists: true,
  });
};
