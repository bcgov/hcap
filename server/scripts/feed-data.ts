/*
   Global ESLint directives:
   * `no-restricted-syntax`: needed for classic `for` loops, which can be blocked with `await`.
   * `no-await-in-loop`: needed to ensure tables are processed one at a time.
*/
/* eslint-disable no-restricted-syntax, no-await-in-loop */

import './load-env';
import path from 'path';
import { parseFile } from 'fast-csv';
import { dbClient, collections } from '../db';
import { approveUsers, employer, healthAuthority, ministryOfHealth } from '../tests/util/keycloak';
import { logWithLevel, displayResultsTable, InsertResult, InsertStatus } from './services';

/** Data found in a given CSV row. Key is the column a given value was found in. */
type CsvRow = {
  [column: string]: string;
};

type TargetTable = {
  /** File name of CSV to read, relative to `dataDirectory` */
  fileName: string;
  /** Table in database to insert entries into */
  table: string;
};

type InsertError = {
  table: string;
  message: string;
  level: 'warn' | 'error';
};

/** Directory (relative to this script) to find CSVs in */
const dataDirectory = '../test-data/';

/**
 * Database tables **in order** of when they should be inserted (due to foreign key relations),
 * with a file name and table name for each.
 */
const defaultTables: TargetTable[] = [
  { fileName: 'participants.csv', table: collections.PARTICIPANTS },
  { fileName: 'employer_sites.csv', table: collections.EMPLOYER_SITES },
  { fileName: 'phases.csv', table: collections.GLOBAL_PHASE },
  { fileName: 'site_phase_allocations.csv', table: collections.SITE_PHASE_ALLOCATION },
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

/**
 * Adds the `created_by` and `updated_by` fields to a row object. This is required for database insertion.
 * @param row Row of data to append the fields to
 * @param userID Value to populate `created_by` and `updated_by` with, defaults to `'system'`
 * @returns Input row with the system fields populated
 */
function addSystemFields(row: CsvRow, userID = 'system') {
  return { ...row, created_by: userID, updated_by: userID };
}

/**
 * Inserts a single row worth of data into a given table in the database.
 * @param row Data for a single row to insert into the database
 * @param table Name of table to insert the row into
 * @returns Result of the operation
 */
async function insertRow(row: CsvRow, table: string): Promise<InsertResult> {
  // Type guard for DB - generally unneeded, but satisfies strict TS stanards.
  if (!('db' in dbClient) || !dbClient.db) throw new Error('Database failed to initialize!');
  try {
    await dbClient.db[table].insert(addSystemFields(row));
    return { id: row.id, table, status: InsertStatus.SUCCESS };
  } catch (error) {
    // Type guard for unexpected error types (i.e. non-DB errors)
    if (!error || typeof error !== 'object' || !('code' in error) || !('detail' in error)) {
      logWithLevel('Unexpected error type during insertion!', 'error');
      throw error;
    }
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
        // Massive's insert function, used in insertRow, does not update the sequence to autopopulate the primary keys
        dbClient.runRawQuery(`ALTER SEQUENCE ${table}_id_seq RESTART WITH ${rowCount + 1}`);
        logWithLevel(`Parsed ${rowCount} rows for ${table}`, 'info');
        Promise.all(rowResults).then((results) => resolve(results));
      });
  });
}

// Script-specific logging functions

/**
 * Logs an unexpected error from populating a table.
 * @param table Table error occurred in
 * @param error Error message or object to log
 */
function logTableError(table: TargetTable, error) {
  logWithLevel('Failed to feed entity!', 'error');
  logWithLevel(` Error occurred in table ${table.table}, fed from ${table.fileName}`, 'error');
  logWithLevel('The following error occurred:', 'error');
  logWithLevel(error, 'error');
}

/**
 * Logs all errors encountered while running the script.
 * @param errors Errors to print.
 */
function logFinalErrors(errors: InsertError[]) {
  if (errors.length) {
    const hasErrors = errors.filter((error) => error.level === 'error').length > 0;
    logWithLevel(
      'Warning: some tables failed to populate properly! Manual cleanup may be required.',
      hasErrors ? 'error' : 'warn'
    );
    if (hasErrors) {
      logWithLevel(
        'Some of these errors were unexpected or critical - this may reflect an issue with your environment.',
        'error'
      );
    } else {
      logWithLevel('Usually this is caused by an unclean database state.', 'warn');
      logWithLevel(
        "Try purging existing data (especially on tables marked with 'duplicate'), and try again.",
        'warn'
      );
    }
    errors.forEach(({ level, message, table }) => {
      logWithLevel(`- ${table}: ${message}`, level);
    });
  }
}

/**
 * Feeds data from specified CSV files to their matching database tables.
 * The main logic of `feed-data`.
 */
export async function feedData(targetTables: TargetTable[], skipMissingTables = false) {
  const errors: InsertError[] = [];
  const tables = await dbClient.db.listTables();

  for (const table of targetTables) {
    // Check if table exists before trying to write to it
    if (!tables.includes(table.table)) {
      if (!skipMissingTables)
        throw new Error(`Table ${table.table} is missing in database. Cannot continue.`);
      // Otherwise just log and move on
      logWithLevel(`Table ${table.table} is missing in database. Skipping.\n`, 'warn');
    } else {
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
          errors.push({
            table: table.table,
            message: `${missingCount} ${
              missingCount > 1 ? 'entries' : 'entry'
            } could not be added due to a missing foreign key`,
            level: 'warn',
          });
        }
        displayResultsTable(results);
      } catch (error) {
        logTableError(table, error);
        errors.push({
          table: table.table,
          message: String(error),
          level: 'error',
        });
      }
    }
  }

  // Display final results
  logWithLevel(
    errors.length ? 'Data population complete, with errors.' : 'Data population complete!',
    'info'
  );
  logFinalErrors(errors);

  // Exit with error if the population didn't go smoothly
  process.exit(errors.length ? 1 : 0);
}

// Only run defaults if directly invoked, allowing other scripts to extend this one
(async function main() {
  if (require.main === module) {
    const skipMissingTables = process.argv.includes('--skip-missing-tables');
    await dbClient.connect();

    await approveUsers(employer, healthAuthority, ministryOfHealth);

    await feedData(defaultTables, skipMissingTables);
  }
})();
