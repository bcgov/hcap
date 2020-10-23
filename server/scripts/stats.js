/* eslint-disable */
const { dbClient } = require('../db/db.js');
const { collections } = require('../db/schema.js');
const inquirer = require('inquirer');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
require('dotenv').config({ path: '../.env' });

dayjs.extend(utc);

const toPostgresDate = (date) => {
  return dayjs(date).utc().format('YYYY-MM-DD HH:mm:ssZ');
}

/* eslint-disable no-console */
(async () => {
  if (require.main === module) {
    try {
      await dbClient.connect();

      const healthAuthorities = [
        '',
        'Interior',
        'Fraser',
        'Vancouver Coastal',
        'Vancouver Island',
        'Northern',
      ];

      let startDate;
      let endDate;

      ({ 'Start Date': startDate } = await inquirer.prompt([{
        name: 'Start Date',
        type: 'input',
        default: dayjs().format('YYYY-MM-DD')
      }]));

      ({ 'End Date (not inclusive)': endDate } = await inquirer.prompt([{
        name: 'End Date (not inclusive)',
        type: 'input',
        default: dayjs().add(1, 'day').format('YYYY-MM-DD')
      }]));

      const queryResults = await dbClient.db[collections.EMPLOYER_FORMS]
        .find({
          'created_at BETWEEN': [toPostgresDate(startDate), toPostgresDate(endDate)],
        });

      const healthAuthorityCount = healthAuthorities.map((authority) => {
        return {
          name: authority,
          submissions: queryResults.reduce(
            (total, result) => {
              if (result.body.healthAuthority === authority) {
                return total + 1;
              } else {
                return total;
              }
            },
            0),
        };
      });

      console.log('------------------');
      console.log(`${startDate} to ${endDate} submissions:`)
      console.table(healthAuthorityCount);
      console.log(`Total submissions: ${healthAuthorityCount.reduce((total, item) => (item.submissions + total), 0)}`);
      console.log('------------------');

      return process.exit();
    } catch (error) {
      console.error(`Failed to retrieve stats, ${error}`);
    }
  }
})();
/* eslint-enable no-console */
