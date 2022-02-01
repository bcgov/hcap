/* eslint-disable camelcase */
const { dbClient, schema, collections } = require('../db');

exports.shorthands = undefined;

exports.up = async () => {
  await dbClient.runRawQuery(schema.postHireRelationTables[0].definition);
};

exports.down = async () => {
  await dbClient.runRawQuery(`DROP TABLE IF EXISTS ${collections.PARTICIPANT_POST_HIRE_STATUS};`);
};
