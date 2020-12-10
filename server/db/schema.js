/**
 * Define db schema rules including collection names and indexes
 */

const collections = {
  PARTICIPANTS: 'participants',
  EMPLOYER_FORMS: 'employer_forms',
  EMPLOYER_SITES: 'employer_sites',
  USERS: 'users',
};

const schema = [
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
