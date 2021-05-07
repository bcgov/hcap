/* eslint-disable no-console */
const { collections } = require('../db');

exports.shorthands = undefined;

exports.up = async (pgm) => {
  pgm.sql(`DELETE FROM ${collections.PARTICIPANTS_DISTANCE};`);

  pgm.sql(`CREATE UNIQUE INDEX IF NOT EXISTS unique_site_participant ON ${collections.PARTICIPANTS_DISTANCE} (participant_id, site_id);`);

  await pgm.sql(`
    INSERT INTO ${collections.PARTICIPANTS_DISTANCE} (participant_id, site_id, distance)
    SELECT
      participant.id,
      (site.body->>'siteId')::int,
      ST_DistanceSphere(
        ST_GeomFromGeoJSON(site.body->>'location'),
        ST_GeomFromGeoJSON(participant.body->>'location')
      )
    FROM ${collections.PARTICIPANTS} AS participant
    CROSS JOIN ${collections.EMPLOYER_SITES} AS site
    ON CONFLICT DO NOTHING;
  `);
};
