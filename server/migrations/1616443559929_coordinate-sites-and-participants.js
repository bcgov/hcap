/* eslint-disable max-len, quotes, no-console */
const { dbClient, collections } = require('../db');
const { getPointsFromPostalCodes } = require('../services/geocodes.js');

exports.up = async () => {
  // Add geometry column to participants and sites
  await dbClient.runRawQuery(`CREATE EXTENSION IF NOT EXISTS POSTGIS;`);
  await dbClient.runRawQuery(`SELECT AddGeometryColumn('public','participants','coords',4326,'POINT',2);`);
  await dbClient.runRawQuery(`SELECT AddGeometryColumn('public','employer_sites','coords',4326,'POINT',2);`);

  const participants = await dbClient.db[collections.PARTICIPANTS].findDoc({});
  const sites = await dbClient.db[collections.EMPLOYER_SITES].findDoc({});

  const postalCodes = participants.concat(sites).map((entry) => entry.postalCode).filter(Boolean);
  const coords = await getPointsFromPostalCodes(postalCodes);

  const promises = participants.map((participant) => {
    const coordObject = coords[participant?.postalCode?.replace(/\s/g, '')];
    if (coordObject?.match) {
      return dbClient.runRawQuery(`UPDATE participants SET coords = ST_SetSRID(ST_MakePoint(${coordObject.lng}, ${coordObject.lat}),4326) where id=${participant.id}`);
    }

    return dbClient.runRawQuery(`UPDATE participants SET coords = NULL where id=${participant.id}`);
  });

  const morePromises = sites.map((site) => {
    const coordObject = coords[site?.postalCode?.replace(/\s/g, '')];
    if (coordObject?.match) {
      return dbClient.runRawQuery(`UPDATE employer_sites SET coords = ST_SetSRID(ST_MakePoint(${coordObject.lng}, ${coordObject.lat}),4326) where id=${site.id}`);
    }

    return dbClient.runRawQuery(`UPDATE employer_sites SET coords = NULL where id=${site.id}`);
  });

  await Promise.allSettled(promises.concat(morePromises));
};
