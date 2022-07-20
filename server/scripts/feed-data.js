/* eslint-disable no-console, no-restricted-syntax, no-await-in-loop */
require('dotenv').config({ path: '../.env' });
const readXlsxFile = require('node-xlsx').default;
const path = require('path');
const { dbClient } = require('../db');
const { createRows } = require('../utils');

(async () => {
  if (require.main === module) {
    /**
     * mapping records in xlsx example:
     * in post_secondary_institutions, have a line where id is 'hello'
     * for foreign key relation to that record in cohorts table, set psi_id to 'hello'
     * the id will be substituted for the real one after it has been created
     */
    // tables IN ORDER they should be inserted (for foreign key relations)
    const tableNames = ['post_secondary_institutions', 'cohorts'];
    // all data created in process
    const testingData = {};

    try {
      const rootDirectory = 'xlsx/';

      await dbClient.connect();
      const response = [];

      for (const tableName of tableNames) {
        testingData[tableName] = {};
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
        let tableData = createRows(rawTableData, headerMap);

        // replace placeholder foreign keys with actual values
        const foreignKeys = dbClient.db[tableName].fks;

        foreignKeys.forEach((foreignKey) => {
          const foreignTable = foreignKey.origin_name;
          const keyNameInThisTable = foreignKey.dependent_columns[0];
          const keyNameInOtherTable = foreignKey.origin_columns[0];

          tableData = tableData.map((tableRow) => {
            const placeHolderKey = tableRow[keyNameInThisTable];
            const realKey = testingData[foreignTable][placeHolderKey][keyNameInOtherTable];

            const updatedTableRow = tableRow;
            updatedTableRow[keyNameInThisTable] = realKey;
            return updatedTableRow;
          });
        });

        const promises = tableData.map((entryData) => {
          const tableEntry = { ...entryData };
          delete tableEntry.id;
          return dbClient.db[tableName].insert(tableEntry);
        });
        const results = await Promise.allSettled(promises);

        results.forEach((result, index) => {
          let { id } = tableData[index];
          switch (result.status) {
            case 'fulfilled':
              testingData[tableName][id] = result.value;
              id = result.value.id;
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
      }
      console.table(response);
      process.exit(0);
    } catch (error) {
      await dbClient.disconnect();
      console.error(`Failed to feed entity, ${error}`);
      process.exit(1);
    }
  }
})();
