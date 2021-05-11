const { dbClient } = require('../db');
require('dotenv').config({ path: '../.env' });
(async function exec(){
    await dbClient.connect();
    const res = await dbClient.db.query(
   `Select DISTINCT body->> 'emailAddress' as email  FROM 
   participants p 
   JOIN participants_status ps 
   on  p.id = ps.participant_id AND ps.status != 'hired'
   WHERE CAST(body ->> 'interested' AS TEXT) = 'yes'  
   AND p.created_at < CURRENT_TIMESTAMP - interval '6 weeks'`)
    console.log(res);
    process.exit(0);
})()


