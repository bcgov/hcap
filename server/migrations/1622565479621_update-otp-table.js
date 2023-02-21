/* eslint-disable camelcase */
import { dbClient, collections } from '../db';

exports.up = () => {
  dbClient.db.query(`
    ALTER TABLE ${collections.CONFIRM_INTEREST}
    ADD COLUMN email_sent BOOLEAN NOT NULL DEFAULT FALSE;
  `);
};
