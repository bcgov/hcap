const fs = require('fs');
const readline = require('readline');
const { dbClient } = require('./db.js');

const objectMap = (row) => {
  const splitRow = row.split('\t');
  return {
    country_code: splitRow[0],
    postal_code: splitRow[1],
    place_name: splitRow[2],
    province: splitRow[3],
    province_code: splitRow[4],
    latitude: splitRow[9],
    longitude: splitRow[10],
  };
};

const readInterface = readline.createInterface({
  input: fs.createReadStream('./CA_postal_codes.txt'),
  output: process.stdout,
  console: false,
});

readInterface.on('line', (line) => {
  console.log(objectMap(line));
});
