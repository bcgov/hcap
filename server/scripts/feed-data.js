/* eslint-disable no-console */
require('dotenv').config({ path: '../.env' });
const readXlsxFile = require('node-xlsx').default;
const path = require('path');
const { dbClient } = require('../db');
const { createRows } = require('../utils');

(async () => {
  if (require.main === module) {
    try {
      const tableNames = ['post_secondary_institutions'];
      const rootDirectory = 'xlsx/';

      await dbClient.connect();
      const response = [];
      tableNames.forEach(async (tableName) => {
        const fileName = `${rootDirectory + tableName}.xlsx`;
        const xlsx = readXlsxFile.parse(path.resolve(__dirname, fileName), {
          raw: true,
        });

        const rawTableData = xlsx[0].data;
        // create 1:1 header mapping so that we can use the createRows function
        const headerMap = rawTableData[0].reduce(
          (accumulator, headerValue) => ({ ...accumulator, [headerValue]: headerValue }),
          {}
        );
        const tableData = createRows(rawTableData, headerMap);

        const promises = tableData.map((tableEntry) => dbClient.db[tableName].insert(tableEntry));
        const results = await Promise.allSettled(promises);

        results.forEach((result, index) => {
          const { id } = tableData[index];
          switch (result.status) {
            case 'fulfilled':
              response.push({ table: tableName, id, status: 'Success' });
              break;
            default:
              if (result.reason.code === '23505') {
                response.push({ table: tableName, id, status: 'Duplicate' });
              } else {
                console.log(result);
                response.push({ table: tableName, id, status: 'Error', message: result.reason });
              }
          }
        });
        console.table(response);
      });
    } catch (error) {
      await dbClient.disconnect();
      console.error(`Failed to feed entity, ${error}`);
      process.exit(1);
    }
  }
})();
