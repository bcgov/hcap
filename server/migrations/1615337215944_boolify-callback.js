/* eslint-disable no-console */
import { dbClient, collections } from '../db';

exports.up = async () => {
  await dbClient.db[collections.PARTICIPANTS].updateDoc(
    { callbackStatus: 'false' },
    { callbackStatus: false }
  );
};
