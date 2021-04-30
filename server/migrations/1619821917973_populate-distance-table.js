/* eslint-disable camelcase */
const { dbClient, collections } = require('../db');

exports.shorthands = undefined;

exports.up = async (pgm) => {
  const participants = await dbClient.db[collections.PARTICIPANTS].findDoc({});
  const sites = await dbClient.db[collections.EMPLOYER_SITES].findDoc({});

  const aWholeLottaPromises = sites.flatMap((site) => participants.map((participant) => pgm.sql(`INSERT INTO participants_distance (participant_id, site_id, distance) VALUES \
      (${participant.id + site.id},\
      (NEW.body->>'siteId')::int,\
      ST_DistanceSphere(ST_GeomFromGeoJSON(NEW.body->>'location'),\
      ST_GeomFromGeoJSON(participant.body->>'location')));`)));

  await Promise.allSettled(aWholeLottaPromises);
};

// exports.down = (pgm) => {};
