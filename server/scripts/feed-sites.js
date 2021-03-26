/* eslint-disable no-console */
require('dotenv').config({ path: '../.env' });
const readXlsxFile = require('node-xlsx').default;
const path = require('path');
const { dbClient } = require('../db');
const { saveSites } = require('../services/employers.js');
const { createRows, verifyHeaders } = require('../utils');

(async () => {
  if (require.main === module) {
    try {
      const columnMap = {
        'HCAP Site ID': 'siteId',
        'Site Name': 'siteName',
        Allocation: 'allocation',
        'Street Address': 'address',
        'Health Authority': 'healthAuthority',
        City: 'city',
        'Post Code': 'postalCode',
        'Registered Business Name': 'registeredBusinessName',
        'Operator Name': 'operatorName',
        'Operator Contact First Name': 'operatorContactFirstName',
        'Operator Contact Last Name': 'operatorContactLastName',
        'Operator Contact Email': 'operatorEmail',
        'Operator Contact Phone': 'operatorPhone',
        'Site Contact First Name': 'siteContactFirstName',
        'Site Contact Last Name': 'siteContactLastName',
        'Site Contact Phone Number': 'siteContactPhoneNumber',
        'Site Contact Email': 'siteContactEmailAddress',
      };

      const xlsx = readXlsxFile.parse(path.resolve(__dirname, `xlsx/${process.argv[2]}`), { raw: true });
      verifyHeaders(xlsx[0].data, columnMap);

      const objectMap = (row) => ({
        ...row,
        operatorPhone: String(row.operatorPhone),
        siteContactPhoneNumber: String(row.siteContactPhoneNumber),
      });

      const rows = createRows(xlsx[0].data, columnMap);
      const employerSites = rows.map((item) => objectMap(item));

      await dbClient.connect();
      const results = await saveSites(employerSites);
      console.table(results);
    } catch (error) {
      console.error(`Failed to feed employer sites entity, ${error}`);
    }
  }
})();
