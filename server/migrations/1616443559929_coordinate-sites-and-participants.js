/* eslint-disable max-len, no-console */
const { dbClient, collections } = require('../db');
const { getPointsFromPostalCodes } = require('../services/geocodes.js');

exports.up = async () => {
  const participants = await dbClient.db[collections.PARTICIPANTS].findDoc(
    { coords: undefined },
  );

  const sites = await dbClient.db[collections.EMPLOYER_SITES].findDoc(
    { coords: undefined },
  );

  const postalCodes = participants.concat(sites).map((entry) => entry.postalCode);
  const coords = await getPointsFromPostalCodes(postalCodes);

  const promises = participants.map((participant) => dbClient.db[collections.PARTICIPANTS].updateDoc(
    { id: participant.id },
    { coords: coords[participant.postalCode] || { match: null } },
  ));

  const morePromises = sites.map((site) => dbClient.db[collections.EMPLOYER_SITES].updateDoc(
    { id: site.id },
    { coords: coords[site.postalCode] || { match: null } },
  ));

  await Promise.allSettled(promises.concat(morePromises));
};
