/**
 * Define db schema rules including collection names and indexes
 */

const collections = {
  FORMS: 'hcap_forms',
};

const schema = [
  {
    collection: collections.FORMS,
    indexes: [
      `CREATE UNIQUE INDEX orbeonId ON ${collections.FORMS}( (body->>'orbeonId') ) ;`,
    ],
  },
];

module.exports = {
  collections,
  schema,
};
