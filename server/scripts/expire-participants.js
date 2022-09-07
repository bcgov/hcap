/* eslint-disable no-console, no-restricted-syntax, no-await-in-loop */
const { dbClient } = require('../db');
const {
  createOpenParticipantsTable,
  getExpiredParticipants,
  dropOpenParticipantsTable,
  expiredParticipantsStatusInvalidation,
} = require('../services/clean-up');
/**
 * Script entry method (main)
 */
(async () => {
  try {
    console.log('Starting expiring script...');
    await dbClient.connect();
    console.log(`Connected to database`);
    await createOpenParticipantsTable();
    const report = await getExpiredParticipants();
    if (report.length > 0) {
      console.log(`Withdrawing ${report.length} open, expired participants`);
      console.table(report);
    } else {
      console.log('No expired open participants found');
    }
    await expiredParticipantsStatusInvalidation();
    console.log('Withdrew expired participants');
    await dropOpenParticipantsTable();
    console.log('Temporary table dropped');
    process.exit(0);
  } catch (err) {
    console.error('clean-up: Failed to run expiring script:', err);
    process.exit(1);
  }
})();
