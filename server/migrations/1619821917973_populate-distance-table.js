/* eslint-disable no-console */
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

  const participantsBatches = [];
  const batchSize = 1000;

  while (participants.length) {
    participantsBatches.push(participants.splice(0, batchSize));
  }

  const promises = sites.flatMap((site) => participantsBatches.map((batch, i) => async () => {
    await pgm.sql(`
    INSERT INTO ${collections.PARTICIPANTS_DISTANCE} (participant_id, site_id, distance) VALUES
      ${batch.map((participant) => `(
        ${participant.id},
        ${site.siteId},
        ST_DistanceSphere(
          ST_GeomFromGeoJSON('${JSON.stringify(site.location)}'),
          ST_GeomFromGeoJSON('${JSON.stringify(participant.location)}')
        )
      )`).join(',')} ON CONFLICT DO NOTHING;`);
    console.log(`Batch ${i} complete`);
  }));

  await Promise.allSettled(promises);
};
