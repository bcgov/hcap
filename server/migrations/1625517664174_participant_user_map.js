/* eslint-disable camelcase */
const { dbClient, schema } = require('../db');

exports.up = async () => {
  await Promise.all(schema.relationalTables.map((item) => dbClient.runRawQuery(item.definition)));
};
