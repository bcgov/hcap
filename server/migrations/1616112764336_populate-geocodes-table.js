/* eslint-disable camelcase, no-restricted-syntax, no-await-in-loop */
const fs = require('fs');
const { join } = require('path');
const readline = require('readline');
const { dbClient, collections } = require('../db');

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
  // Erase all entries before importing data
  await dbClient.db[collections.GEOCODES].destroy({});
  const file = join(__dirname, 'assets', 'BC_postal_codes.txt');

  const readInterface = readline.createInterface({
    input: fs.createReadStream(file),
    output: null,
    console: false,
  });

  const items = [];

  for await (const line of readInterface) {
    items.push(objectMap(line));
  }

  console.log(`adding ${items.length} to the geocodes db`);
  // Add data in 10k increments
  while (items.length > 0) {
    const subset = items.splice(0, 10000);
    await dbClient.db[collections.GEOCODES].insert(subset);
    console.log(`${items.length} entries remaining`);
  }
  console.log('Done!');
};
