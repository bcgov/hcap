/*
   Global ESLint directives.
   * `no-restricted-syntax`: needed for classic `for` loops, which can be blocked with `await`.
   * `no-await-in-loop`: needed to ensure tables are processed one at a time.
*/
/* eslint-disable no-restricted-syntax, no-await-in-loop */
// TODO: MINOR: try reducing implicit any
// TODO: MINOR: add JSDoc to all functions, and consider moving some to services
// TODO: MINOR: move utils to services

import './load-env';
import path from 'path';
import { parseFile } from 'fast-csv';
import { dbClient } from '../db';
import { collections } from '../db/schema';
import { logWithLevel, displayResultsTable, InsertResult, InsertStatus } from './services';

/** Directory (relative to this script) to find CSVs in */
const dataDirectory = '../test-data/';
// ENHANCEMENT: (optional) add CLI argument for external file

/** tables **in order** of when they should be inserted (for foreign key relations) */
const targetTables: { fileName: string; table: string }[] = [
  // TODO: DOCUMENT: make ticket to expand site dataset
  // TODO: DOCUMENT: make ticket to make collections an enum
  // TODO: DOCUMENT: ticket for clear-data being broken
  { fileName: 'participants.csv', table: collections.PARTICIPANTS },
  { fileName: 'employer_sites.csv', table: collections.EMPLOYER_SITES },
  { fileName: 'phases.csv', table: collections.GLOBAL_PHASE },
  {
    fileName: 'post_secondary_institutions.csv',
    table: collections.POST_SECONDARY_INSTITUTIONS,
  },
  { fileName: 'cohorts.csv', table: collections.COHORTS },
  { fileName: 'cohort_participants.csv', table: collections.COHORT_PARTICIPANTS },
  { fileName: 'participants_status.csv', table: collections.PARTICIPANTS_STATUS },
  { fileName: 'participant_post_hire_status.csv', table: collections.PARTICIPANT_POST_HIRE_STATUS },
  { fileName: 'return_of_service_status.csv', table: collections.ROS_STATUS },
];

function addSystemFields(row) {
  return { ...row, created_by: 'system', updated_by: 'system' };
}

// TODO: MINOR: Improve typing
async function insertRow(row, table): Promise<InsertResult> {
  try {
    await dbClient.db[table].insert(addSystemFields(row));
    return { id: row.id, table, status: InsertStatus.SUCCESS };
  } catch (error) {
    // WARN: This also catches duplicate errors from related tables, such as `participants_distance` if populating `employer_sites`.
    // Ideally that should have its own case, but generally that ends up causing FK errors that get caught later anyways.
    if (error.code === '23505') return { id: row.id, table, status: InsertStatus.DUPLICATE };
    if (error.code === '23503') {
      logWithLevel(`${error.detail} Row ${row.id} \x1b[4mwill not be inserted\x1b[24m.`, 'warn');
      return { id: row.id, table, status: InsertStatus.MISSING_FK };
    }
    throw error;
  }
}

/**
 * Inserts all rows from a streamed CSV file into a table in the database.
 * @param filePath Name of file to read from
 * @param table Name of table in DB to write to
 * @returns Array of `InsertResult`s for each transaction
 */
function insertCSV(filePath: string, table: string) {
  return new Promise<InsertResult[]>((resolve, reject) => {
    const rowResults: Promise<InsertResult>[] = [];
    parseFile(filePath, { headers: true })
      .on('error', reject)
      .on('data', (row) => rowResults.push(insertRow(row, table)))
      .on('end', (rowCount: number) => {
        logWithLevel(`Parsed ${rowCount} rows for ${table}`, 'info');
        Promise.all(rowResults).then((results) => resolve(results));
      });
  });
}

// TODO: MAJOR: make sure this runs
/**
 * Deletes all database rows with IDs found in a CSV file.
 * Used as part of cleanup upon failure.
 * @param filePath Name of file to read from
 * @param table Name of table in DB to write to
 * @returns Promise that resolves on successful erasure, or rejects with an error on failure.
 */
function eraseFromCSV(filePath: string, table: string) {
  return new Promise<void>((resolve, reject) => {
    const ids: string[] = [];
    parseFile(filePath, { headers: true })
      .on('error', reject)
      .on('data', (row) => {
        // Get ID from row and verify it's valid
        const { id } = row;
        if (typeof id !== 'string' || !id) reject(Error(`Missing ID in row: ${row}`));
        ids.push(id);
      })
      .on('end', async (rowCount: number) => {
        logWithLevel(`Removing ${rowCount} rows in ${table}`, 'info');
        await dbClient.db[table].destroy({ id: ids });
        logWithLevel(`Deleted records with ids [ ${ids.join(', ')} ]`, 'info');
        resolve();
      });
  });
}

/**
 * Called in the case of insertion error.
 * Cleans up all inserted data,
 * and displays all attempted inserts to user to assist debugging. TODO: MAJOR: VERIFY THIS
 */
async function cleanup() {
  try {
    // Reverse direction of array to delete dependent records first
    for (const table of [...targetTables].reverse()) {
      await eraseFromCSV(path.join(__dirname, table.fileName), table.table);
    }
  } catch (e) {
    logWithLevel('Error deleting data - manual cleanup required.', 'error');
    logWithLevel(e, 'error');
    await dbClient.disconnect();
    process.exit(1);
  }
  await dbClient.disconnect();
  process.exit(0);
}

// TODO: MAJOR: debug all error handling

/** Main */
(async () => {
  await dbClient.connect();
  const warnings: { table: string; message: string }[] = [];

  for (const table of targetTables) {
    logWithLevel(`Populating table ${table.table} from ${table.fileName}`, 'info');
    try {
      const results = await insertCSV(
        path.join(__dirname, dataDirectory, table.fileName),
        table.table
      );
      if (results.find((result) => result.status === InsertStatus.MISSING_FK)) {
        const missingCount = results.filter(
          (result) => result.status === InsertStatus.MISSING_FK
        ).length;
        warnings.push({
          table: table.table,
          message: `${missingCount} ${
            missingCount > 1 ? 'entries' : 'entry'
          } could not be added due to a missing foreign key`,
        });
      }
      displayResultsTable(results);
    } catch (error) {
      // TODO: MINOR: make sure this includes specific failed entry
      logWithLevel('Failed to feed entity!', error);
      logWithLevel(` Error occurred in table ${table.table}, fed from ${table.fileName}`, error);
      logWithLevel('The following error occurred:', error);
      logWithLevel(error, error);
      cleanup();
    }
  }
  logWithLevel(
    warnings.length ? 'Data population complete, with errors.' : 'Data population complete!',
    'info'
  );
  if (warnings.length) {
    logWithLevel(
      'Warning: some tables failed to populate properly! Manual cleanup may be required.',
      'warn'
    );
    logWithLevel('Usually this is caused by an unclean database state.', 'warn');
    logWithLevel(
      "Try purging existing data (especially on tables marked with 'duplicate'), and try again.",
      'warn'
    );
    warnings.forEach((warning) => {
      logWithLevel(`- ${warning.table}: ${warning.message}`, 'warn');
    });
  }
  process.exit(0);
})();
