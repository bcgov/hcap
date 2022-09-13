/* eslint-disable no-console, no-restricted-syntax, no-await-in-loop */
const { dbClient } = require('../db');
const {
  createStaleOpenParticipantsTable,
  getStaleOpenParticipants,
  dropStaleOpenParticipantsTable,
  invalidateStaleOpenParticipants,
} = require('../services/clean-up');
const logger = require('../logger.js');

/**
 * Script entry method (main)
 */
(async () => {
  try {
    console.log('Starting withdrawing stale open participants script...');
    await dbClient.connect();
    console.log(`Connected to database`);
    await createStaleOpenParticipantsTable();
    const report = await getStaleOpenParticipants();
    if (report.length > 0) {
      logger.info({
        action: 'clean_stale_open_participants',
        performed_by: 'cron',
        length: report.length,
        participants: report,
      });
      console.log(`Withdrawing ${report.length} stale, open participants`);
      console.table(report);
      await invalidateStaleOpenParticipants();
      console.log('Withdrew stale, open participants');
    } else {
      console.log('No stale open participants found');
    }
    await dropStaleOpenParticipantsTable();
    console.log('Temporary table dropped');
    process.exit(0);
  } catch (err) {
    console.error('clean-up: Failed to run stale open participants script:', err);
    process.exit(1);
  }
})();
