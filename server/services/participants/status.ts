import { dbClient, collections } from '../../db';

export const invalidateStatus = async ({ currentStatusId }) =>
  dbClient.db[collections.PARTICIPANTS_STATUS].update(
    {
      id: currentStatusId,
    },
    {
      current: false,
    }
  );
