/* eslint-disable camelcase */
const fs = require('fs');
const { join } = require('path');
const readline = require('readline');
const { dbClient } = require('../db/db.js');

const tableName = 'geocodes';

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
  const file = join(__dirname, 'assets', 'BC_postal_codes_test.txt');

  const readInterface = readline.createInterface({
    input: fs.createReadStream(file),
    output: process.stdout,
    console: false,
  });

  console.log(dbClient.db);

  readInterface.on('line', (line) => {
    dbClient.db[tableName].save(objectMap(line), (err, res) => {
      if (err) console.error(err);
      console.log(res);
    });
  });
};
