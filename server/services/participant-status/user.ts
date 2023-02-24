import { invalidateStatus } from '../participants';
import { dbClient, collections } from '../../db';

export const hideStatusForUser = async ({ userId, statusId }) => {
  // Load status
  const status = await dbClient.db[collections.PARTICIPANTS_STATUS].findOne({ id: statusId });
  if (!status || !status.current) {
    return;
  }

  // Status without site mean legacy status
  if (!status.data?.site) {
    // Invalidate
    await invalidateStatus({ currentStatusId: statusId });
    return;
  }

  // Status with site: hide status for user
  const hiddenForUserIds = {
    ...(status.data?.hiddenForUserIds || {}),
    [userId]: true,
  };
  await dbClient.db[collections.PARTICIPANTS_STATUS].update(
    {
      id: statusId,
    },
    {
      data: {
        ...status.data,
        hiddenForUserIds,
      },
    }
  );
};
