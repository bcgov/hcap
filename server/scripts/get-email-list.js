/* eslint-disable no-console */
const { dbClient } = require('../db');
require('dotenv').config({ path: '../.env' });
(async function exec() {
  await dbClient.connect();
  const res = await dbClient.db.query(`
    SELECT p.body ->> 'emailAddress' AS email
    FROM participants p 
    WHERE 
        p.body ->> 'emailAddress' NOT IN (
            SELECT p2.body->> 'emailAddress'
            FROM participants p2 
            JOIN participants_status ps
            ON p2.id = ps.participant_id AND ps.status = 'hired'
        )
        AND (CAST(p.body ->> 'interested' AS TEXT) = 'yes'  
            OR CAST(p.body->> 'interested' AS TEXT) IS NULL)
        AND (
                (p.updated_at < CURRENT_TIMESTAMP - interval '6 weeks'
                AND p.updated_at IS NOT NULL)
                OR (p.updated_at IS NULL 
                    AND p.created_at < CURRENT_TIMESTAMP - interval '6 weeks')
	     )`);
  console.log(res);
  process.exit(0);
})();
