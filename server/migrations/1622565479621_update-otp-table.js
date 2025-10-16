/* eslint-disable camelcase */
const { dbClient, collections } = require('../db');

exports.up = () => {
  dbClient.db.query(`
    ALTER TABLE ${collections.CONFIRM_INTEREST}
    ADD COLUMN email_sent BOOLEAN NOT NULL DEFAULT FALSE;
  `);
};
