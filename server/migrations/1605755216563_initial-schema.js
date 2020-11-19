/* eslint-disable camelcase */
const { collections } = require('../db/schema.js');

exports.up = async (pgm) => {
  const tableExists = async (table) => {
    try {
      await pgm.db.query(`SELECT 'public.${table}'::regclass`);
      return true;
    } catch (error) {
      return false;
    }
  };

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

  const employerFormsExists = await tableExists(collections.EMPLOYER_FORMS);
  if (!employerFormsExists) {
    pgm.createTable(collections.EMPLOYER_FORMS, collectionTableSchema);
  }

  const applicantsExists = await tableExists(collections.APPLICANTS);
  if (!applicantsExists) {
    pgm.createTable(collections.APPLICANTS, collectionTableSchema);
    pgm.createIndex(collections.APPLICANTS, '(body->>\'maximusId\')', { unique: true });
  }
};
