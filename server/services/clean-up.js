const { dbClient } = require('../db');

/**
 * Helpers
 */
/**
 * @description Returns a list of stale in-progress participants statuses
 * @returns {Promise<Array>}
 */
const staleInProgressParticipants = async () => {
  // Get all in-progress participant statuses
  const queryString = `select id, participant_id, status, employer_id, created_at::date as last_updated from participants_status ps where status in ('prospecting', 'interviewing', 'offer_made', 'rejected') and current = true and created_at < (NOW() - interval '30 day') order by participant_id, id;`;
  return dbClient.db.query(queryString);
};

/**
 * @description - Invalidate stale in-progress participants statuses
 * @returns {Promise<void>}
 */
const staleParticipantsStatusInvalidation = async () => {
  const updateStatement = `DO $$
    DECLARE
      status_rec RECORD;
      data_obj JSONB;
      current_time TIMESTAMP;
    BEGIN
    current_time = NOW();
    FOR status_rec IN SELECT * FROM participants_status WHERE status IN ('prospecting', 'interviewing', 'offer_made', 'rejected') AND current = true AND created_at < (NOW() - interval '30 day') 
    LOOP
      IF status_rec.data IS NULL THEN
        data_obj = JSONB_SET('{}'::JSONB, '{cleanupDate}', to_jsonb(current_time));
      ELSE
        data_obj = JSONB_SET(status_rec.data::JSONB, '{cleanupDate}', to_jsonb(current_time));
      END IF;
      UPDATE participants_status SET data = data_obj, current = false WHERE id = status_rec.id;
    END LOOP;
    END;
  $$ LANGUAGE plpgsql;
  `;
  await dbClient.db.query(updateStatement);
};

/**
 * @description - Clean and free all stale in-progress participants statuses and return those statuses as report
 * @returns {Promise<Array<Objects>>}
 */
const cleanStaleInProgressParticipant = async () => {
  // Print all stale in-progress participants
  const results = (await staleInProgressParticipants()) || [];

  if (results.length > 0) {
    // Invalidate stale in-progress participants
    await staleParticipantsStatusInvalidation();
  }

  // Returning results as report
  return results;
};

/**
 * Exports
 */
module.exports = {
  cleanStaleInProgressParticipant,
};
