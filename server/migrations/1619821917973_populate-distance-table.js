const { dbClient, collections } = require('../db');

exports.shorthands = undefined;

exports.up = async (pgm) => {
  const participants = await dbClient.db[collections.PARTICIPANTS].findDoc({
    'location IS NOT': null,
  });
  const sites = await dbClient.db[collections.EMPLOYER_SITES].findDoc({
    'location IS NOT': null,
  });

  const aWholeLottaPromises = sites.flatMap((site) => participants.map((participant, i) => {
    if (i < 10) console.log(JSON.stringify(participant.location), JSON.stringify(site.location));
    return pgm.sql(`
      INSERT INTO participants_distance (participant_id, site_id, distance) VALUES (
        ${participant.id},
        ${site.siteId},
        ST_DistanceSphere(
          ST_GeomFromGeoJSON('${JSON.stringify(site.location)}'),
          ST_GeomFromGeoJSON('${JSON.stringify(participant.location)}')
        )
      );`);
  }));

  await Promise.allSettled(aWholeLottaPromises);
};
