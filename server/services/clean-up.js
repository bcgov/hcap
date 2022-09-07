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
  const queryString = `select id, participant_id, status, employer_id, created_at::date as last_updated from participants_status ps where status in ('prospecting', 'interviewing', 'offer_made') and current = true and created_at < (NOW() - interval '30 day') order by participant_id, id;`;
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
    FOR status_rec IN SELECT * FROM participants_status WHERE status IN ('prospecting', 'interviewing', 'offer_made') AND current = true AND created_at < (NOW() - interval '30 day') 
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
 * @description - Creates a table of all participants that should currently be Open - Never engaged, or current status = rejected / reject_ack
 * @returns {Promise<Array>}
 */
const createOpenParticipantsTable = async () => {
  // Creates a temporary table, meant for removal later
  const createTable = `
    CREATE TEMPORARY TABLE expired_participants_table (
      id integer,
      last_updated date,
      previously_engaged boolean
    );
  `;
  await dbClient.db.query(createTable);

  const pushUnengagedParticipants = `
    INSERT INTO expired_participants_table
    SELECT
    p.id, created_at::date AS last_updated, FALSE as perviously_engaged
    FROM participants p
    WHERE p.body->>'interested' = 'yes'
    AND p.updated_at < (NOW() - interval '6 month')
    AND NOT EXISTS(
      SELECT ps.participant_id
      FROM participants_status ps
      WHERE p.id = ps.participant_id
    );
  `;
  await dbClient.db.query(pushUnengagedParticipants);

  const pushRejectedParticipants = `
    INSERT INTO expired_participants_table
    SELECT
      p.id, max(ps.created_at) AS last_updated, TRUE as perviously_engaged
    FROM participants p
    INNER JOIN participants_status ps ON
      p.id = ps.participant_id
      AND ps.status IN ('rejected', 'reject_ack')
      AND ps.current = 'true'
      AND ps.created_at < (NOW() - interval '6 month')
    WHERE p.body->>'interested' = 'yes'
    -- If anyone has a status in the past 6 months, exclude them
    AND p.id NOT IN (
      SELECT DISTINCT ON (ps.participant_id)
      ps.participant_id
      FROM participants_status ps
      WHERE ps.created_at > (NOW() - interval '6 month')
      AND ps.current = true
      GROUP BY ps.participant_id
    )
    GROUP BY p.id;
  `;
  await dbClient.db.query(pushRejectedParticipants);
};

/**
 * Gets all participants from temporary table who haven't been updated in 6 months
 * Relies on createOpenParticipantsTable
 * @returns {void}
 */
const getExpiredParticipants = async () => {
  const getQuery = `
    SELECT * FROM expired_participants_table
    WHERE last_updated < (NOW() - interval '6 month');
  `;
  return dbClient.db.query(getQuery);
};

/**
 * Drops temporary table created
 */
const dropOpenParticipantsTable = async () => {
  const dropQuery = `
    DROP TABLE expired_participants_table;
  `;
  return dbClient.db.query(dropQuery);
};

/**
 * For all the expired participants, invalidates their statuses and withdraws the participant
 * @returns {void}
 */
const expiredParticipantsStatusInvalidation = async () => {
  const updateStatement = `DO $$
    DECLARE
      participant_rec RECORD;
      status_rec RECORD;
      data_obj JSONB;
      body_obj JSONB;
    BEGIN
    FOR participant_rec IN
      SELECT * FROM participants WHERE id IN (
        SELECT id from expired_participants_table
        WHERE last_updated < (NOW() - interval '6 month')
      )
    LOOP
      -- Invalidates all current statuses for an expired participant
      FOR status_rec IN SELECT * FROM participants_status WHERE participant_id = participant_rec.id AND current = true
      LOOP
        IF status_rec.data IS NULL THEN
          data_obj = JSONB_SET('{}'::JSONB, '{cleanupDate}', to_jsonb(NOW()));
        ELSE
          data_obj = JSONB_SET(status_rec.data::JSONB, '{cleanupDate}', to_jsonb(NOW()));
        END IF;
        UPDATE participants_status SET data = data_obj, current = false WHERE id = status_rec.id;
      END LOOP;
      -- Withdraws participant and sets an expiration date
      body_obj = JSONB_SET(participant_rec.body::JSONB, '{expiredDate}', to_jsonb(NOW()));
      body_obj = body_obj || '{"interested" : "withdrawn"}';
      UPDATE participants SET body = body_obj, updated_at = NOW() WHERE id = participant_rec.id;
    END LOOP;
    END;
  $$ LANGUAGE plpgsql;
  `;
  await dbClient.db.query(updateStatement);
};

/**
 * Exports
 */
module.exports = {
  cleanStaleInProgressParticipant,
  createOpenParticipantsTable,
  getExpiredParticipants,
  dropOpenParticipantsTable,
  expiredParticipantsStatusInvalidation,
};
