/**
 * Define db schema rules including collection names and indexes
 */

const collections = {
  PARTICIPANTS: 'participants',
  EMPLOYER_FORMS: 'employer_forms',
  EMPLOYER_SITES: 'employer_sites',
};

const schema = [
  {
    collection: collections.PARTICIPANTS,
    indexes: [
      `CREATE UNIQUE INDEX maximusId ON ${collections.PARTICIPANTS}( (body->>'maximusId') ) ;`,
    ],
  },
  {
    collection: collections.EMPLOYER_SITES,
    indexes: [
      `CREATE UNIQUE INDEX siteId ON ${collections.EMPLOYER_SITES}( (body->>'siteId') ) ;`,
    ],
  },
];

module.exports = { collections, schema };
