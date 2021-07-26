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
  CONFIRM_INTEREST: 'confirm_interest',
  USERS: 'users',
  USER_PARTICIPANT_MAP: 'user_participant_map',
  POST_SECONDARY_INSTITUTIONS: 'post_secondary_institutions',
  COHORTS: 'cohorts',
  COHORT_PARTICIPANTS: 'cohort_participants',
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
      definition: `CREATE TABLE IF NOT EXISTS ${collections.CONFIRM_INTEREST} (
        email_address varchar(100) unique not null, 
        otp UUID primary key DEFAULT gen_random_uuid(),
        created_at timestamp with time zone DEFAULT now()
        )`,
    },
    {
      definition: `CREATE TABLE IF NOT EXISTS ${collections.USER_PARTICIPANT_MAP} (
        id serial primary key,
        user_id varchar(200) not null,
        participant_id integer not null,
        created_at timestamp with time zone DEFAULT now()
      )`,
    },
  ],
  psiRelationalTables: [
    {
      definition: `CREATE TABLE IF NOT EXISTS ${collections.POST_SECONDARY_INSTITUTIONS} (
        id serial primary key,
        institute_name varchar(200) unique not null,
        health_authority varchar(50) not null,
        postal_code varchar(10) not null
      )`,
    },
    {
      definition: `CREATE TABLE IF NOT EXISTS ${collections.COHORTS} (
        id serial primary key,
        cohort_name varchar(200) not null,
        start_date date not null,
        end_date date not null,
        cohort_size integer not null,
        psi_id integer references ${collections.POST_SECONDARY_INSTITUTIONS}
      )`,
    },
    {
      definition: `CREATE TABLE IF NOT EXISTS ${collections.COHORT_PARTICIPANTS} (
        id serial primary key,
        cohort_id integer references ${collections.COHORTS},
        participant_id integer references ${collections.PARTICIPANTS}
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
