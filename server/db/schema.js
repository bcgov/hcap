/**
 * Define db schema rules including collection names and indexes
 */

// All table names in our database
export const databaseCollections = {
  PARTICIPANTS: 'participants',
  PARTICIPANTS_STATUS: 'participants_status',
  GEOCODES: 'geocodes',
  PARTICIPANTS_DISTANCE: 'participants_distance',
  EMPLOYER_SITES: 'employer_sites',
  CONFIRM_INTEREST: 'confirm_interest',
  USERS: 'users',
  USER_PARTICIPANT_MAP: 'user_participant_map',
  POST_SECONDARY_INSTITUTIONS: 'post_secondary_institutions',
  COHORTS: 'cohorts',
  COHORT_PARTICIPANTS: 'cohort_participants',
  PARTICIPANT_WAITLIST: 'participant_waitlist',
  PARTICIPANT_POST_HIRE_STATUS: 'participant_post_hire_status',
  ROS_STATUS: 'return_of_service_status',
  ADMIN_OPS_AUDIT: 'admin_operation_audit',
  GLOBAL_PHASE: 'phase',
  SITE_PHASE_ALLOCATION: 'site_phase_allocation',
};

// Potentially deprecated: these are still referred to in the app but are seemingly no longer tables in the database
export const collections = {
  EMPLOYER_FORMS: 'employer_forms',
  SITE_PARTICIPANTS_STATUS: 'site_participants_status',
  ...databaseCollections,
};

export const views = {
  PARTICIPANTS_STATUS_INFOS: 'participants_status_infos',
};

// Relational tables should contain a `definition` property
// Document tables should contain `collection` and `indexes` properties
// `definition` is a raw SQL string used to create the table
// `collection` is the name of the document table
// `indexes` are JSONB field names on which unique indexes should be created
export const schema = {
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
        street_address varchar(200) not null,
        city varchar(50) not null,
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
  phaseTables: [
    {
      definition: `CREATE TABLE IF NOT EXISTS ${collections.GLOBAL_PHASE} (
        id serial primary key,
        name varchar(255) not null,
        start_date date not null,
        end_date date not null,
        created_by varchar(255) not null,
        updated_by varchar(255) not null,
        created_at timestamp with time zone DEFAULT now() not null,
        updated_at timestamp with time zone DEFAULT now() not null
      )`,
    },
    {
      definition: `CREATE TABLE IF NOT EXISTS ${collections.SITE_PHASE_ALLOCATION} (
        id serial primary key,
        phase_id integer references ${collections.GLOBAL_PHASE},
        site_id integer references ${collections.EMPLOYER_SITES},
        allocation integer not null,
        start_date date,
        end_date date,
        created_by varchar(255) not null,
        updated_by varchar(255) not null,
        created_at timestamp with time zone DEFAULT now() not null,
        updated_at timestamp with time zone DEFAULT now() not null
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

