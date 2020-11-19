/* eslint-disable camelcase */
const { collections } = require('../db/schema.js');

exports.up = async (pgm) => {
  const tableExists = async (table) => pgm.db.query(`SELECT 'public.${table}'::regclass`);

  const collectionTableSchema = {
    id: 'serial',
    body: {
      type: 'jsonb',
      notNull: true,
    },
    search: {
      type: 'tsvector',
    },
    created_at: {
      type: 'timestamp with time zone',
      default: pgm.func('now()'),
    },
    updated_at: {
      type: 'timestamp with time zone',
    },
  };

  if (!tableExists(collections.EMPLOYER_FORMS)) {
    pgm.createTable(collections.EMPLOYER_FORMS, collectionTableSchema);
  }

  if (!tableExists(collections.APPLICANTS)) {
    pgm.createTable(collections.APPLICANTS, collectionTableSchema);
    pgm.createIndex(collections.APPLICANTS, '(body->>\'maximusId\')', { unique: true });
  }
};
