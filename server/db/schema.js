/**
 * Define db schema rules including collection names and indexes
 */

const collections = {
  PARTICIPANTS: 'participants',
  EMPLOYER_FORMS: 'employer_forms',
  EMPLOYER_SITE: 'employer_site',
};

const schema = [
  {
    collection: collections.PARTICIPANTS,
    indexes: [
      `CREATE UNIQUE INDEX maximusId ON ${collections.PARTICIPANTS}( (body->>'maximusId') ) ;`,
    ],
  },
];

module.exports = { collections, schema };
