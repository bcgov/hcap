/**
 * Define db schema rules including collection names and indexes
 */

const collections = {
  PARTICIPANTS: 'participants',
  PARTICIPANTS_STATUS: 'participants_status',
  EMPLOYER_FORMS: 'employer_forms',
  EMPLOYER_SITES: 'employer_sites',
  USERS: 'users',
};

const schema = [
  {
    participantsStatusTable: `CREATE TABLE IF NOT EXISTS ${collections.PARTICIPANTS_STATUS}(
      id serial primary key, 
      "employer_id" varchar(255) not null, 
      "participant_id" integer not null, 
      "status" varchar(255) not null,
      "current" boolean not null, 
      "created_at" timestamp with time zone DEFAULT now(),
      "data" jsonb
      )`,
    indexes: [],
  },
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
];

module.exports = { collections, schema };
