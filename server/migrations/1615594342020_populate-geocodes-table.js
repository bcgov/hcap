/* eslint-disable camelcase */
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
  const file = join(__dirname, 'assets', 'BC_postal_codes.txt');

  const readInterface = readline.createInterface({
    input: fs.createReadStream(file),
    output: process.stdout,
    console: false,
  });

  readInterface.on('line', async (line) => {
    try {
      await dbClient.db[collections.GEOCODES].save(objectMap(line), (err, res) => {
        if (err) console.error(err);
        console.log(res);
      });
    } catch (error) {
      // 23505 is a duplication error
      if (error.code !== 23505) throw error;
    }
  });
};
