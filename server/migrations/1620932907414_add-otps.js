/* eslint-disable camelcase */
const { dbClient, collections, schema } = require('../db');

exports.up = async () => {
  const { PARTICIPANTS, CONFIRM_INTEREST, PARTICIPANTS_STATUS } = collections;

  await dbClient.db.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);

  await Promise.all(schema.relationalTables.map((item) => dbClient.runRawQuery(item.definition)));

  await dbClient.db.query(`
    INSERT INTO
      ${CONFIRM_INTEREST} (email_address)
    SELECT
      DISTINCT p.body->>'emailAddress' AS email
    FROM
      ${PARTICIPANTS} p
    WHERE
      p.body->>'emailAddress' NOT IN (
        SELECT
          p2.body->>'emailAddress'
        FROM
          ${PARTICIPANTS} p2
          JOIN ${PARTICIPANTS_STATUS} ps ON p2.id = ps.participant_id
          AND ps.status = 'hired'
      )
      AND (
        CAST(p.body->>'interested' AS TEXT) = 'yes'
        OR CAST(p.body->>'interested' AS TEXT) IS NULL
      )
      AND (
        to_timestamp(p.body->>'userUpdatedAt', 'YYYY-MM-DD') < CURRENT_TIMESTAMP - interval '6 weeks'
      )

      ON CONFLICT DO NOTHING
  `);
};
