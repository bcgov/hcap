/* eslint-disable camelcase */
import { syncUser } from '../services/sync-user';

exports.shorthands = 'sync_user_with_kc';

exports.up = async () => {
  await syncUser({ log: true });
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
exports.down = () => {};
