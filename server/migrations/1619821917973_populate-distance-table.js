const { dbClient, collections } = require('../db');

exports.shorthands = undefined;

exports.up = async (pgm) => {
  pgm.sql(`DELETE FROM ${collections.PARTICIPANTS_DISTANCE};`);

  pgm.sql(`CREATE UNIQUE INDEX IF NOT EXISTS unique_site_participant ON ${collections.PARTICIPANTS_DISTANCE} (participant_id, site_id);`);

  const participants = await dbClient.db[collections.PARTICIPANTS].findDoc({
    'location IS NOT': null,
  });
  const sites = await dbClient.db[collections.EMPLOYER_SITES].findDoc({
    'location IS NOT': null,
  });

  const aWholeLottaPromises = sites.flatMap((site) => participants.map((participant) => pgm.sql(`
    INSERT INTO ${collections.PARTICIPANTS_DISTANCE} (participant_id, site_id, distance) VALUES (
      ${participant.id},
      ${site.siteId},
      ST_DistanceSphere(
        ST_GeomFromGeoJSON('${JSON.stringify(site.location)}'),
        ST_GeomFromGeoJSON('${JSON.stringify(participant.location)}')
      )
    ) ON CONFLICT DO NOTHING;`)));

  await Promise.allSettled(aWholeLottaPromises);
};
