/**
 * Define db schema rules including collection names and indexes
 */

const collections = {
  FORMS: 'hcap-forms',
};

const schema = [
  {
    collection: collections.FORMS,
    indexes: [
      { key: 'id', options: { unique: true } },
      { key: 'orbeonId', options: { unique: true, sparse: true } },
      { key: 'createdAt', options: {} },
    ],
  },
];

module.exports = {
  collections,
  schema,
};
