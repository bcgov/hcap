/* eslint-disable camelcase */
const { dbClient, schema } = require('../db');

exports.shorthands = 'add-global-phase-table';

exports.up = async () => {
  await dbClient.runRawQuery(schema.globalPhase.definition);
};
