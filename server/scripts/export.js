const csv = require('fast-csv');
const { writeFileSync } = require('fs');
const path = require('path');
const { dbClient } = require('../db/db.js');
const { collections } = require('../db/schema.js');
require('dotenv').config({ path: '../.env' });

const roles = [
  'Registered Nurse',
  'Licensed Practical Nurse',
  'Health Care Assistant',
  'Food Services Worker',
  'Housekeeping',
  'COVID-19 IPC Response',
  'Site Administrative Staff',
];

const mapToObject = (m) => {
  const o = {};
  m.forEach((v, k) => {
    o[k] = v;
  });
  return o;
};

/* eslint-disable no-console */
(async () => {
  if (require.main === module) {
    try {
      await dbClient.connect();
      const db = await dbClient.db[collections.EMPLOYER_FORMS];
      const results = await db.find({}, {
        order: [{
          field: 'created_at',
          direction: 'desc',
          nulls: 'first',
        }],
      });

      console.log(`Found ${results.length} record(s), writing CSV file...`);

      const csvStream = csv.format({ headers: true });

      results.forEach((result) => {
        const columns = new Map();
        columns.set('Submitted Date', result.created_at);
        columns.set('Registered Business Name', result.body.registeredBusinessName);
        columns.set('Operator Name', result.body.operatorName);
        columns.set('Operator Contact First Name', result.body.operatorContactFirstName);
        columns.set('Operator Contact Last Name', result.body.siteContactLastName);
        columns.set('Operator Contact Email', result.body.operatorEmail);
        columns.set('Operator Contact Phone', result.body.operatorPhone);
        columns.set('Business Operator Address', result.body.operatorAddress);
        columns.set('Operator Postal Code', result.body.operatorPostalCode);
        columns.set('Site Name', result.body.siteName);
        columns.set('Site Address', result.body.address);
        columns.set('Health Authority', result.body.healthAuthority);
        columns.set('Site Contact First Name', result.body.siteContactFirstName);
        columns.set('Site Contact Last Name', result.body.siteContactLastName);
        columns.set('Site Contact Email', result.body.emailAddress);
        columns.set('Site Contact Phone Number', result.body.phoneNumber);
        columns.set('Site Type', result.body.siteType);
        columns.set('Other Site Type', result.body.otherSite);
        columns.set('Number of Public Long Term Care Beds', result.body.numPublicLongTermCare);
        columns.set('Number of Private Long Term Care Beds', result.body.numPrivateLongTermCare);
        columns.set('Number Public Assisted Living Beds', result.body.numPublicAssistedLiving);
        columns.set('Number of Private Assisted Living Beds', result.body.numPrivateAssistedLiving);

        roles.forEach((role) => {
          columns.set(`${role} Current Full Time`, result.body.workforceBaseline.find((i) => i.role === role).currentFullTime);
          columns.set(`${role} Current Part Time`, result.body.workforceBaseline.find((i) => i.role === role).currentPartTime);
          columns.set(`${role} Current Casual`, result.body.workforceBaseline.find((i) => i.role === role).currentCasual);
          columns.set(`${role} Vacancy Full Time`, result.body.workforceBaseline.find((i) => i.role === role).vacancyFullTime);
          columns.set(`${role} Vacancy Part Time`, result.body.workforceBaseline.find((i) => i.role === role).vacancyPartTime);
          columns.set(`${role} Vacancy Casual`, result.body.workforceBaseline.find((i) => i.role === role).vacancyCasual);
        });

        columns.set('Health Care Support Workers for Site', result.body.hcswFteNumber);
        columns.set('Staffing Challenges', result.body.staffingChallenges);

        csvStream.write(mapToObject(columns));
      });

      const chunks = [];
      csvStream
        .on('data', (chunk) => chunks.push(chunk))
        .on('error', (error) => console.log(error))
        .on('end', () => {
          const string = Buffer.concat(chunks).toString();
          writeFileSync(path.join(__dirname, 'export.csv'), string);
          console.log('Done');
        });

      csvStream.end();
    } catch (error) {
      console.error(`Failed to retrieve stats, ${error}`);
    }
  }
})();
/* eslint-enable no-console */
