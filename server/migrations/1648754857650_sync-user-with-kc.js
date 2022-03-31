/* eslint-disable camelcase */
const { syncUser } = require('../services/sync-user');

exports.shorthands = 'sync_user_with_kc';

exports.up = async () => {
  await syncUser({ log: true });
};

exports.down = () => {};
