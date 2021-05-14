/**
 * Define db schema rules including collection names and indexes
 */

const collections = {
  PARTICIPANTS: 'participants',
  PARTICIPANTS_STATUS: 'participants_status',
  GEOCODES: 'geocodes',
  PARTICIPANTS_DISTANCE: 'participants_distance',
  EMPLOYER_FORMS: 'employer_forms',
  EMPLOYER_SITES: 'employer_sites',
  OTPS: 'otps',
  USERS: 'users',
};

const views = {
  PARTICIPANTS_STATUS_INFOS: 'participants_status_infos',
};

// Relational tables should contain a `definition` property
// Document tables should contain `collection` and `indexes` properties
// `definition` is a raw SQL string used to create the table
// `collection` is the name of the document table
// `indexes` are JSONB field names on which unique indexes should be created
const schema = {
  relationalTables: [
    {
      definition: `CREATE TABLE IF NOT EXISTS ${collections.PARTICIPANTS_STATUS} (
        id serial primary key,
        "employer_id" varchar(255) not null,
        "participant_id" integer not null,
        "status" varchar(255) not null,
        "current" boolean not null,
        "created_at" timestamp with time zone DEFAULT now(),
        "data" jsonb
        )`,
    },
    {
      definition: `CREATE TABLE IF NOT EXISTS ${collections.PARTICIPANTS_DISTANCE} (
        id serial primary key,
        "participant_id" integer not null,
        "site_id" integer not null,
        "distance" integer,
        UNIQUE (participant_id, site_id)
        )`,
    },
    {
      definition: `CREATE TABLE IF NOT EXISTS ${collections.GEOCODES} (
        id serial primary key, 
        "country_code" varchar(2) not null, 
        "postal_code" varchar(20) unique not null, 
        "place_name" varchar(180) not null,
        "province" varchar(50) not null,
        "province_code" integer not null, 
        "latitude" real not null,
        "longitude" real not null
        )`,
    },
    {
      definition: `CREATE TABLE IF NOT EXISTS ${collections.OTPS} (
        id serial primary key, 
        "emailAddress" varchar(100) unique not null, 
        otp UUID NOT NULL DEFAULT gen_random_uuid(),
        "timestamp" timestamp with time zone DEFAULT now()
        )`,
    },
  ],
  documentTables: [
    {
      collection: collections.PARTICIPANTS,
      indexes: ['maximusId'],
    },
    {
      collection: collections.EMPLOYER_SITES,
      indexes: ['siteId'],
    },
    {
      collection: collections.USERS,
      indexes: ['keycloakId'],
    },
  ],
};

module.exports = { collections, views, schema };
