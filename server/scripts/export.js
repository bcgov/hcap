/* eslint-disable */
const { dbClient } = require('../db/db.js');
const { collections } = require('../db/schema.js');
const csv = require('fast-csv');
const { writeFileSync } = require('fs');
const path = require('path');
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
          nulls: 'first'
        }]
      });

      console.log(`Found ${results.length} record(s), writing CSV file...`);

      const csvStream = csv.format({ headers: true });

      results.forEach(result => {
        let fields = {
          'Submitted Date': result.created_at,
          'Registered Business Name': result.body.registeredBusinessName,
          'Operator Name': result.body.operatorName,
          'Operator Contact First Name': result.body.operatorContactFirstName,
          'Operator Contact Last Name': result.body.siteContactLastName,
          'Operator Contact Email': result.body.operatorEmail,
          'Operator Contact Phone': result.body.operatorPhone,
          'Business Operator Address': result.body.operatorAddress,
          'Operator Postal Code': result.body.operatorPostalCode,
          'Site Name': result.body.siteName,
          'Site Address': result.body.address,
          'Health Authority': result.body.healthAuthority,
          'Site Contact First Name': result.body.siteContactFirstName,
          'Site Contact Last Name': result.body.siteContactLastName,
          'Site Contact Email': result.body.emailAddress,
          'Site Contact Phone Number': result.body.phoneNumber,
          'Site Type': result.body.siteType,
          'Other Site Type': result.body.otherSite,
          'Number of Public Long Term Care Beds': result.body.numPublicLongTermCare,
          'Number of Private Long Term Care Beds': result.body.numPrivateLongTermCare,
          'Number Public Assisted Living Beds': result.body.numPublicAssistedLiving,
          'Number of Private Assisted Living Beds': result.body.numPrivateAssistedLiving,
          'Health Care Support Workers for Site': result.body.hcswFteNumber,
          'Staffing Challenges': result.body.staffingChallenges,
        };

        roles.forEach(role => {
          fields = {
            ...fields,
            [`${role} Current Casual`]: result.body.workforceBaseline.find(item => item.role === role).currentCasual,
            [`${role} Current Full Time`]: result.body.workforceBaseline.find(item => item.role === role).currentFullTime,
            [`${role} Vacancy Casual`]: result.body.workforceBaseline.find(item => item.role === role).vacancyCasual,
            [`${role} Current Part Time`]: result.body.workforceBaseline.find(item => item.role === role).currentPartTime,
            [`${role} Vacancy Full Time`]: result.body.workforceBaseline.find(item => item.role === role).vacancyFullTime,
            [`${role} Vacancy Part Time`]: result.body.workforceBaseline.find(item => item.role === role).vacancyPartTime,
          };
        });

        csvStream.write(fields);
      });

      const chunks = [];
      csvStream
        .on('data', (chunk) => chunks.push(chunk))
        .on('error', (error) => console.log(error))
        .on('end', () => {
          const string = Buffer.concat(chunks).toString();
          writeFileSync(path.join(__dirname, 'export.csv'), string);
          console.log(`Done.`);
        });

      csvStream.end();
    } catch (error) {
      console.error(`Failed to retrieve stats, ${error}`);
    }
  }
})();
/* eslint-enable no-console */
