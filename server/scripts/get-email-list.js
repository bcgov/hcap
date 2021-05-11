const { dbClient } = require('../db');
require('dotenv').config({ path: '../.env' });
(async function exec(){
    await dbClient.connect();
    const res = await dbClient.db.query(
   `SELECT DISTINCT body->> 'emailAddress' AS email 
    FROM participants p 
    JOIN participants_status ps 
        ON  p.id = ps.participant_id AND ps.status != 'hired'
    WHERE 
        CAST(p.body ->> 'interested' AS TEXT) = 'yes'  
        OR CAST(p.body->> 'interested' AS TEXT) IS NULL
        AND p.created_at < CURRENT_TIMESTAMP - interval '6 weeks'`)
    console.log(res);
    process.exit(0);
})()


