/* eslint-disable camelcase */
import { collections } from '../db';

exports.shorthands = 'update-ros-table';

exports.up = async (pgm) => {
  await pgm.addColumns(
    collections.ROS_STATUS,
    {
      is_current: {
        type: 'boolean',
        notNull: true,
        default: false,
      },
    },
    { ifNotExists: true }
  );
};

exports.down = async (pgm) => {
  await pgm.dropColumns(collections.ROS_STATUS, ['is_current'], {
    ifExists: true,
  });
};
