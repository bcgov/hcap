/* eslint-disable no-restricted-syntax, no-await-in-loop */
const { dbClient, collections } = require('../db');

exports.up = async (pgm) => {
  await dbClient.runRawQuery('CREATE EXTENSION IF NOT EXISTS POSTGIS;');

  await pgm.alterColumn('participants_distance', 'distance', { type: 'integer', notNull: false });

  await pgm.createIndex(collections.PARTICIPANTS_DISTANCE, 'participant_id', { ifNotExists: true });
  await pgm.createIndex(collections.PARTICIPANTS_DISTANCE, 'site_id', { ifNotExists: true });
  await pgm.createIndex(collections.PARTICIPANTS_DISTANCE, 'distance', { ifNotExists: true });

  await pgm.dropTrigger(collections.EMPLOYER_SITES, 'update_postal_code_s', { ifExists: true });
  await pgm.createTrigger(collections.EMPLOYER_SITES, 'update_postal_code_s', {
    when: 'BEFORE',
    operation: ['INSERT', 'UPDATE OF body'],
    language: 'plpgsql',
    level: 'ROW',
    replace: true,
  },
  `
  DECLARE
   loc record;
   participant record;
   loc_count integer := 0;
  BEGIN
    IF NEW.body->>'postalCode' = OLD.body->>'postalCode' THEN
      RETURN NEW;
    END IF;

    select count(*) into loc_count FROM geocodes WHERE REPLACE(postal_code, ' ', '')=REPLACE(NEW.body->>'postalCode', ' ', '');
    if loc_count = 0 then
      RETURN NEW;
    end if;

    SELECT longitude::text,latitude::text INTO loc FROM geocodes WHERE REPLACE(postal_code, ' ', '')=REPLACE(NEW.body->>'postalCode', ' ', '');
    NEW.body = jsonb_set(NEW.body::jsonb, '{location}', ('{"type":"Point","coordinates":[' || loc.longitude || ',' || loc.latitude || ']}')::jsonb);
    IF OLD IS NULL THEN
      FOR participant IN
        SELECT * FROM participants
      LOOP
        INSERT INTO participants_distance (participant_id, site_id, distance) VALUES
        (participant.id, (NEW.body->>'siteId')::int, ST_DistanceSphere(ST_GeomFromGeoJSON(NEW.body->>'location'), ST_GeomFromGeoJSON(participant.body->>'location')));
      END LOOP;
    ELSE
      FOR participant IN
        SELECT * FROM participants
      LOOP
        UPDATE participants_distance SET distance = ST_DistanceSphere(ST_GeomFromGeoJSON(NEW.body->>'location'), ST_GeomFromGeoJSON(participant.body->>'location')) where participant_id=participant.id AND site_id=(NEW.body->>'siteId')::int;
      END LOOP;
    END IF;
    RETURN NEW;
  END;
  `);

  await pgm.dropTrigger(collections.PARTICIPANTS, 'update_postal_code_p', { ifExists: true });
  await pgm.createTrigger(collections.PARTICIPANTS, 'update_postal_code_p', {
    when: 'BEFORE',
    operation: ['INSERT', 'UPDATE OF body'],
    language: 'plpgsql',
    level: 'ROW',
    replace: true,
  },
  `
  DECLARE
   loc record;
   site record;
   loc_count integer := 0;
  BEGIN
    IF NEW.body->>'postalCode' = OLD.body->>'postalCode' THEN
      RETURN NEW;
    END IF;

    select count(*) into loc_count FROM geocodes WHERE REPLACE(postal_code, ' ', '')=REPLACE(NEW.body->>'postalCode', ' ', '');

    if loc_count = 0 then
        RETURN NEW;
    end if;

    SELECT longitude::text,latitude::text INTO loc FROM geocodes WHERE REPLACE(postal_code, ' ', '')=REPLACE(NEW.body->>'postalCode', ' ', '');
    NEW.body = jsonb_set(NEW.body::jsonb, '{location}', ('{"type":"Point","coordinates":[' || loc.longitude || ',' || loc.latitude || ']}')::jsonb);
    IF OLD IS NULL THEN
      FOR site IN
        SELECT * FROM employer_sites
      LOOP
        INSERT INTO participants_distance (participant_id, site_id, distance) VALUES
        (NEW.id, (site.body->>'siteId')::int, ST_DistanceSphere(ST_GeomFromGeoJSON(NEW.body->>'location'), ST_GeomFromGeoJSON(site.body->>'location')));
      END LOOP;
    ELSE
      FOR site IN
        SELECT * FROM employer_sites
      LOOP
        UPDATE participants_distance SET distance = ST_DistanceSphere(ST_GeomFromGeoJSON(NEW.body->>'location'), ST_GeomFromGeoJSON(site.body->>'location')) where participant_id=NEW.id AND site_id=(site.body->>'siteId')::int;
      END LOOP;
    END IF;
    RETURN NEW;
  END;
  `);

  await pgm.dropTrigger(collections.PARTICIPANTS, 'delete_participant_distance_p', { ifExists: true });
  await pgm.createTrigger(collections.PARTICIPANTS, 'delete_participant_distance_p', {
    when: 'AFTER',
    operation: 'DELETE',
    language: 'plpgsql',
    level: 'ROW',
    replace: true,
  },
  `
  BEGIN
    DELETE FROM participants_distance WHERE participant_id=OLD.id;
    RETURN OLD;
  END;
  `);

  await pgm.dropTrigger(collections.EMPLOYER_SITES, 'delete_participant_distance_s', { ifExists: true });
  await pgm.createTrigger(collections.EMPLOYER_SITES, 'delete_participant_distance_s', {
    when: 'AFTER',
    operation: 'DELETE',
    language: 'plpgsql',
    level: 'ROW',
    replace: true,
  },
  `
  BEGIN
    DELETE FROM participants_distance WHERE site_id=(site.body->>'siteId')::int;
    RETURN OLD;
  END;
  `);
};
