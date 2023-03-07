/*
   Global ESLint directives.
   * `no-console`: For quick and easy result printing.
     * TODO: MINOR: Remove this and make dedicated logging functions that are exempt.
   * `no-restricted-syntax`: needed for classic `for` loops, which can be blocked with `await`.
   * `no-await-in-loop`: needed to ensure tables are processed one at a time.
*/
/* eslint-disable no-console, no-restricted-syntax, no-await-in-loop */
// TODO: MINOR: try reducing implicit any

import './load-env';
import path from 'path';
import { parseFile } from 'fast-csv';
import { dbClient } from '../db';
import { collections } from '../db/schema';

enum InsertStatus {
  SUCCESS = 'Success',
  DUPLICATE = 'Duplicate',
  MISSING_FK = 'Missing Foreign Key',
}

type InsertResult = {
  table: string;
  id: string;
  status: InsertStatus;
};

/** Directory (relative to this script) to find CSVs in */
const dataDirectory = '../test-data/';
// ENHANCEMENT: add CLI argument for external file
// tables IN ORDER they should be inserted (for foreign key relations)
const targetTables = [
  // TODO: MAJOR: sites
  { fileName: 'participants.csv', table: collections.PARTICIPANTS },
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

async function insertRow(row, table): Promise<InsertResult> {
  try {
    await dbClient.db[table].insert(addSystemFields(row));
    return { id: row.id, table, status: InsertStatus.SUCCESS };
  } catch (error) {
    if (error.code === '23505') return { id: row.id, table, status: InsertStatus.DUPLICATE };
    if (error.code === '23503') return { id: row.id, table, status: InsertStatus.MISSING_FK };
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
        console.log(`Parsed ${rowCount} rows for ${table}`);
        Promise.all(rowResults).then((results) => resolve(results));
      });
  });
}

// TODO: MINOR: consider deleting only that which was written
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
        console.log(`Removing ${rowCount} rows in ${table}`);
        await dbClient.db[table].destroy({ id: ids });
        console.log(`Deleted records with ids [ ${ids.join(', ')} ]`);
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
    console.log('Error deleting data - manual cleanup required.', e);
    await dbClient.disconnect();
    process.exit(1);
  }
  await dbClient.disconnect();
  process.exit(0);
}

function displayResultsTable(results: InsertResult[]) {
  const includedStatuses = new Set(results.map((result) => result.status));

  const output = [...includedStatuses]
    // Make an entry for each status type found
    .map((status) => ({
      status,
      table: results[0].table,
      // Make an array of all IDs in this status, grouped into ranges
      ids: results
        .filter((result) => result.status === status)
        .map((result) => Number(result.id))
        .sort((a, b) => a - b)
        .reduce((ranges: [number, number][], id) => {
          if (ranges.length && [id, id - 1].includes(ranges.at(-1)[1])) {
            const newRanges = [...ranges];
            newRanges.at(-1)[1] = id;
            return newRanges;
          }
          return [...ranges, [id, id]];
        }, [])
        .map((range) => (range[0] === range[1] ? String(range[0]) : `${range[0]} - ${range[1]}`)),
    }))
    // Restructure so each resulting ID range gets a dedicated row
    .map((status) =>
      status.ids.map((idRange) => ({ status: status.status, table: status.table, ids: idRange }))
    )
    .reduce((merged, next) => [...merged, ...next]);

  console.table(output);
}

// TODO: MAJOR: debug all error handling

/** Main */
(async () => {
  await dbClient.connect();
  for (const table of targetTables) {
    console.log(`Populating table ${table.table} from ${table.fileName}`);
    try {
      const results = await insertCSV(
        path.join(__dirname, dataDirectory, table.fileName),
        table.table
      );
      displayResultsTable(results);
    } catch (error) {
      // TODO: MINOR: make sure this includes specific failed entry
      console.error('Failed to feed entity!');
      console.error(` Error occurred in table ${table.table}, fed from ${table.fileName}`);
      console.error('The following error occurred:');
      console.error(error);
      cleanup();
    }
  }
  console.log('Data population complete!');
  process.exit(0);
})();
