/* eslint-disable camelcase */
const { dbClient, collections } = require('../db');

const query = `CREATE TABLE IF NOT EXISTS ${collections.GEOCODES}(
      id serial primary key, 
      "country_code" varchar(2) not null, 
      "postal_code" varchar(20) not null, 
      "place_name" varchar(180) not null,
      "province" varchar(50) not null,
      "province_code" integer not null, 
      "latitude" real not null,
      "longitude" real not null
      )`;

const makeIndexQuery = `CREATE UNIQUE INDEX postal_code ON ${collections.GEOCODES}(postal_code);`;

exports.up = async () => {
  await dbClient.runRawQuery(query);
  await dbClient.runRawQuery(makeIndexQuery);
};
