/**
 * Define db schema rules including collection names and indexes
 */

const collections = {
  EMPLOYEE_FORMS: 'employee_forms',
  EMPLOYER_FORMS: 'employer_forms',
};

const schema = [
  {
    collection: collections.EMPLOYEE_FORMS,
    indexes: [
      `CREATE UNIQUE INDEX orbeonId ON ${collections.EMPLOYEE_FORMS}( (body->>'orbeonId') ) ;`,
    ],
  },
];

module.exports = {
  collections,
  schema,
};
