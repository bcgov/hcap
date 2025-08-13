import * as csv from 'fast-csv';
import { writeFileSync } from 'fs';
import path from 'path';

// convert array to csv format and file and add in table id
export const convertToCsv = async (incr: number, arr: unknown[], filename: string) => {
  const chunks: Buffer[] = [];
  const csvStream = csv.format({ headers: true });
  let currentId = incr;

  arr.forEach((obj) => {
    csvStream.write({ id: currentId, ...obj });
    currentId += 1;
  });

  // eslint-disable-next-line no-console
  console.log(`------- Writing to CSV file:  \x1b[33m${filename}\x1b[0m`);

  csvStream
    .on('data', (chunk) => chunks.push(chunk))
    .on('error', (e) => {
      // eslint-disable-next-line no-console
      console.error(e);
    })
    .on('end', () => {
      const string = Buffer.concat(chunks).toString();
      writeFileSync(path.join(__dirname, '..', '..', 'test-data', filename), string, { flag: 'w' });
    });
  csvStream.end();
};
