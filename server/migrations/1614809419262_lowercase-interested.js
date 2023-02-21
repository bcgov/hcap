/* eslint-disable max-len, no-console */
import { dbClient, collections } from '../db';

exports.up = async () => {
  await dbClient.db[collections.PARTICIPANTS].updateDoc(
    { interested: 'Yes' },
    { interested: 'yes' }
  );
};
