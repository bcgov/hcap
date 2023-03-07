/* eslint-disable no-console */
import type { InsertResult } from './shared-types';

/**
 * Prints a given string to the console, with colour coding.
 * Essentially a wrapper for `console` with more colourful output.
 * @param text String to output to the console.
 * @param level Log level. This determines colour and output stream.
 */
export function logWithLevel(text: string, level: 'info' | 'warn' | 'error') {
  if (level === 'info') console.log(`${text}`);
  else console.log(`${level === 'warn' ? '\x1b[33m' : '\x1b[31m'} ${text}\x1b[0m`);
}

/**
 * Prints an array of `InsertResult` objects as a table,
 * merging together contiguous ranges of IDs with the same status.
 * NOTE: this function assumes a single targeted table for all entries!
 * Misleading output may occur if passing in multiple DB tables worth of results at once.
 * @param results Array of `InsertResult` objects to turn into a table.
 */
export function displayResultsTable(results: InsertResult[]) {
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
  // Log an empty line directly to give room under the table for the next output
  console.log();
}
