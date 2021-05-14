/* eslint-disable camelcase */
const { dbClient, collections, schema } = require('../db');

exports.up = async () => {
  await schema.relationalTables.map((item) => dbClient.runRawQuery(item.definition));

  await dbClient.db.query(
    `CREATE INDEX IF NOT EXISTS email_address_index ON ${collections.CONFIRM_INTEREST}(email_address);`
  );

  await dbClient.db.query(
    `CREATE INDEX IF NOT EXISTS otp_index ON ${collections.CONFIRM_INTEREST}(otp);`
  );

  const updates = await dbClient.db
    .query(`INSERT INTO ${collections.CONFIRM_INTEREST} (email_address)
  SELECT DISTINCT p.body ->> 'emailAddress' AS email
      FROM participants p 
      WHERE 
          p.body ->> 'emailAddress' NOT IN (
              SELECT p2.body->> 'emailAddress'
              FROM participants p2 
              JOIN participants_status ps
              ON p2.id = ps.participant_id AND ps.status = 'hired'
          )
          AND (p.body ->> 'interested')::TEXT = 'yes'  
              OR (p.body->> 'interested')::TEXT IS NULL
    
    ON CONFLICT DO NOTHING
  `);
};
