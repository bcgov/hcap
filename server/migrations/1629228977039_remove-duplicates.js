/* eslint-disable camelcase */

const { dbClient } = require('../db');

exports.up = async () => {
  const duplicatedIds = await dbClient.db.query(`
            SELECT 
            id
            from participants_status as p1
            where current = true AND status IN ('archived','rejected')
            AND EXISTS(
                SELECT * from participants_status as p2 
                WHERE p1.id != p2.id 
                and p1.id > p2.id 
                AND p1.status = p2.status 
                and p1.employer_id = p2.employer_id 
                and p2.current = TRUE 
                and p1.participant_id = p2.participant_id
            )
        `);
  await duplicatedIds.forEach(async (duplicate) => {
    await dbClient.db.query(`
            UPDATE participants_status
            SET current = FALSE 
            WHERE id = ${duplicate.id}
        `);
  });
};

exports.down = () => {};
