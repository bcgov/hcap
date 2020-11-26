/**
 * Define db schema rules including collection names and indexes
 */

const collections = {
  APPLICANTS: 'applicants',
  EMPLOYER_FORMS: 'employer_forms',
  EMPLOYER_SITE: 'employer_site',
};

const schema = [
  {
    collection: collections.APPLICANTS,
    indexes: [
      `CREATE UNIQUE INDEX maximusId ON ${collections.APPLICANTS}( (body->>'maximusId') ) ;`,
    ],
  },
];

module.exports = { collections, schema };
