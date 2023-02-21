/* eslint-disable max-len, quotes, no-console */
import { dbClient, collections } from '../db';
import { getPointsFromPostalCodes } from '../services/geocodes';

exports.up = async () => {
  const participants = await dbClient.db[collections.PARTICIPANTS].findDoc({});
  const sites = await dbClient.db[collections.EMPLOYER_SITES].findDoc({});

  const postalCodes = participants
    .concat(sites)
    .map((entry) => entry.postalCode)
    .filter(Boolean);
  const coords = await getPointsFromPostalCodes(postalCodes);

  const promises = participants.map((participant) => {
    const coordObject = coords[participant?.postalCode?.replace(/\s/g, '')];
    if (coordObject?.match) {
      return dbClient.runRawQuery(`UPDATE participants SET body = jsonb_insert(body::jsonb, '{location}',\
      '{"type":"Point","coordinates":[${coordObject.lng},${coordObject.lat}]}') where id=${participant.id}`);
    }

    return dbClient.runRawQuery(
      `UPDATE participants SET body = jsonb_insert(body::jsonb, '{location}', null) where id=${participant.id}`
    );
  });

  const morePromises = sites.map((site) => {
    const coordObject = coords[site?.postalCode?.replace(/\s/g, '')];
    if (coordObject?.match) {
      return dbClient.runRawQuery(`UPDATE employer_sites SET body = jsonb_insert(body::jsonb, '{location}',\
      '{"type":"Point","coordinates":[${coordObject.lng},${coordObject.lat}]}') where id=${site.id}`);
    }

    return dbClient.runRawQuery(
      `UPDATE employer_sites SET body = jsonb_insert(body::jsonb, '{location}', null) where id=${site.id}`
    );
  });

  await Promise.allSettled(promises.concat(morePromises));
};
