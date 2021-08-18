/* eslint-disable camelcase */

const { dbClient } = require('../db');

exports.up = async () => {
  await dbClient.db.query(`
  with ids_to_update as ( 
    SELECT 
          id
          FROM participants_status as p1
          WHERE 
      p1.current = true 
      AND p1.status IN ('archived','rejected')
            AND EXISTS
      (
        SELECT * from participants_status as p2 
        WHERE p1.id > p2.id 
          AND p1.status = p2.status 
          AND p1.employer_id = p2.employer_id 
          AND p2.current = TRUE 
          AND p1.participant_id = p2.participant_id
            )
    )
    update participants_status 
    set current = false 
    from ids_to_update
    WHERE participants_status.id = ids_to_update.id
        `);
};

exports.down = () => {};
