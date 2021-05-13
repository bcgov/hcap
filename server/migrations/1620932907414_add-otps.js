/* eslint-disable camelcase */
const { dbClient, collections } = require('../db');

exports.up = async () => {
  await dbClient.db.query(
    `UPDATE ${collections.PARTICIPANTS} SET body = jsonb_set(body, '{otp}', ('"' || (gen_random_uuid()::TEXT) || '"')::JSONB);`
  );
};
