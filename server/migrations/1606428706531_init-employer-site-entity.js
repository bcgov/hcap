/* eslint-disable camelcase */
const { collections } = require('../db/schema.js');
const { dbClient } = require('../db/db.js');
const { ERROR_DUPLICATED } = require('../db/common');

const indexName = `${collections.EMPLOYER_SITE}_site_id`;
exports.up = async () => {
  try {
    await dbClient.db.createDocumentTable(collections.EMPLOYER_SITE);
  } catch (err) {
    if (err.code !== ERROR_DUPLICATED) {
      throw err;
    }
  }
  try {
    await dbClient.db.query(`CREATE UNIQUE INDEX ${indexName}  ON ${collections.EMPLOYER_SITE}( (body->>'siteId') ) ;`);
  } catch (err) {
    if (err.code !== ERROR_DUPLICATED) {
      throw err;
    }
  }
};

exports.down = async () => {
  try {
    await dbClient.db.query(`DROP INDEX IF EXISTS ${indexName}`);
    await dbClient.db.query(`DROP TABLE IF EXISTS ${collections.EMPLOYER_SITE}`);
  } catch (err) {
    if (err.code !== ERROR_DUPLICATED) {
      throw err;
    }
  }
};
