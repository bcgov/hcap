/* eslint-disable camelcase */
const { collections } = require('../db');

exports.shorthands = 'drop-allocation-dates';

exports.up = (pgm) => {
  pgm.dropColumns(collections.SITE_PHASE_ALLOCATION, ['start_date', 'end_date'], {
    ifExists: true,
  });
};

exports.down = (pgm) => {
  pgm.addColumns(
    collections.SITE_PHASE_ALLOCATION,
    {
      start_date: {
        type: 'date',
        notNull: false,
      },
      end_date: {
        type: 'date',
        notNull: false,
      },
    },
    { ifNotExists: true }
  );
};
