/* eslint-disable camelcase, no-restricted-syntax, no-await-in-loop, no-console */
import fs from 'fs';
import { join } from 'path';
import readline from 'readline';
import { dbClient, collections, schema } from '../db';
import logger from '../logger';

const objectMap = (row) => {
  const split_row = row.split('\t');
  return {
    country_code: split_row[0],
    postal_code: split_row[1],
    place_name: split_row[2],
    province: split_row[3],
    province_code: split_row[4],
    latitude: split_row[9],
    longitude: split_row[10],
  };
};

exports.up = async () => {
  for (const schemaItem of schema.relationalTables) {
    await dbClient.runRawQuery(schemaItem.definition);
  }
  await dbClient.reload();
  let filename = 'BC_postal_codes.txt';
  if (process.env.NODE_ENV === 'test') {
    filename = '100_postal_codes.txt';
  }
  const file = join(__dirname, 'assets', filename);

  // @ts-ignore: HACK to fix apparent bug in node types package
  const readInterface = readline.createInterface({
    input: fs.createReadStream(file),
    output: null,
    console: false,
  });

  const items = [];

  for await (const line of readInterface) {
    items.push(objectMap(line));
  }

  logger.info(`adding ${items.length} to the geocodes db`);
  // Add data in 10k increments
  while (items.length > 0) {
    const subset = items.splice(0, 10000);
    await dbClient.db[collections.GEOCODES].insert(subset);
    logger.info(`${items.length} entries remaining`);
  }
  logger.info('All geocodes inserted!');
};
