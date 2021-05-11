const { dbClient } = require('../db');
require('dotenv').config({ path: '../.env' });
(async function exec(){
    await dbClient.connect();
    const res = await dbClient.db.query(
   `Select body->> 'emailAddress' as email 
    FROM participants 
    WHERE CAST(body ->> 'interested' AS TEXT) = 'yes' AND
    created_at < CURRENT_TIMESTAMP - interval '6 weeks'`)
    console.log(res);
    process.exit(0);
})()


