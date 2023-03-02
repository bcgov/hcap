/* eslint-disable no-console, no-restricted-syntax, no-await-in-loop */
import { dbClient } from '../db';
import { cleanStaleInProgressParticipant } from '../services/clean-up';
/**
 * Script entry method (main)
 */
(async () => {
  try {
    console.log('Starting clean-up script...');
    await dbClient.connect();
    console.log(`Connected to database`);
    const report = await cleanStaleInProgressParticipant();
    if (report.length > 0) {
      console.log(`Cleaned up ${report.length} stale in-progress participants`);
      console.table(report);
    } else {
      console.log('No stale in-progress participants found');
    }
    process.exit(0);
  } catch (err) {
    console.error('clean-up: Failed to run clean-up script:', err);
    process.exit(1);
  }
})();
