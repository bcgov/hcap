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
      DISTINCT p.body ->> 'emailAddress' AS email
    FROM
      ${PARTICIPANTS} as p FULL OUTER JOIN
      ${PARTICIPANTS_STATUS} as ps ON p.id = ps.participant_id
      AND ps.status != 'hired'
      AND (
          (p.body ->> 'interested') :: TEXT = 'yes'
          OR (p.body ->> 'interested') :: TEXT IS NULL
      )
    WHERE p.body ->> 'emailAddress'  IS NOT NULL
    ON CONFLICT DO NOTHING
  `);
};
