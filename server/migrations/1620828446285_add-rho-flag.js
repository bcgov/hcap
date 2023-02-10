import { collections } from '../db';

exports.up = async (pgm) => {
  await pgm.sql(`
    UPDATE ${collections.EMPLOYER_SITES}
    SET body = jsonb_set(body::jsonb, '{isRHO}', 'false')
    WHERE body->>'isRHO' IS NULL;
  `);
};
