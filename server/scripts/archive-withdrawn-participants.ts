/* eslint-disable no-console */
import dayjs from 'dayjs';
import { dbClient } from '../db';
import { archiveWithdrawnParticipants, getEngagedWithdrawnParticipants } from '../services/archive';

(async function main() {
  if (require.main === module) {
    console.log('Starting archiving the participants withdrawn for more than 4 months.');
    await dbClient.connect();

    const withdrawnParticipants = await getEngagedWithdrawnParticipants();

    console.log(`${withdrawnParticipants.length} active withdrawn participants found.`);

    const oldWithdrawnParticipants = withdrawnParticipants
      .filter(({ body }) => {
        const withdrawnChanges = body.history
          ?.filter((c) => c.changes?.[0].to === 'withdrawn')
          .sort((a, b) => (dayjs(a.timestamp).isBefore(b.timestamp) ? 1 : -1));
        if (withdrawnChanges?.length > 0) {
          const lastChange = withdrawnChanges[0];
          if (dayjs(new Date()).diff(lastChange.timestamp, 'month') >= 4) {
            return true;
          }
        }
        return false;
      })
      .map(({ id }) => id);

    if (oldWithdrawnParticipants.length) {
      await archiveWithdrawnParticipants(oldWithdrawnParticipants);
      console.log(`archived ${oldWithdrawnParticipants.length} participants `);
    }
  }
})();
