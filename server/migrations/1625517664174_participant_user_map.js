/* eslint-disable camelcase */
import { dbClient, schema } from '../db';

exports.up = async () => {
  await Promise.all(schema.relationalTables.map((item) => dbClient.runRawQuery(item.definition)));
};
