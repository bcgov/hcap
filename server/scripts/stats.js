/* eslint-disable no-console */
import inquirer from 'inquirer';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { dbClient, collections } from '../db';

require('dotenv').config({ path: '../.env' });

dayjs.extend(utc);

const toPostgresDate = (date) => dayjs.utc(date).format('YYYY-MM-DD HH:mm:ssZ');

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

      const { 'Start Date': startDate } = await inquirer.prompt([
        {
          name: 'Start Date',
          type: 'input',
          default: dayjs().format('YYYY-MM-DD'),
        },
      ]);

      const { 'End Date (not inclusive)': endDate } = await inquirer.prompt([
        {
          name: 'End Date (not inclusive)',
          type: 'input',
          default: dayjs().add(1, 'day').format('YYYY-MM-DD'),
        },
      ]);

      const queryResults = await dbClient.db[collections.EMPLOYER_FORMS].find({
        'created_at BETWEEN': [toPostgresDate(startDate), toPostgresDate(endDate)],
      });

      const healthAuthorityCount = healthAuthorities.map((authority) => ({
        name: authority,
        submissions: queryResults.reduce((total, result) => {
          if (result.body.healthAuthority === authority) {
            return total + 1;
          }
          return total;
        }, 0),
      }));

      console.log('------------------');
      console.log(`${startDate} to ${endDate} submissions:`);
      console.table(healthAuthorityCount);
      console.log(
        `Total submissions: ${healthAuthorityCount.reduce(
          (total, item) => item.submissions + total,
          0
        )}`
      );
      console.log('------------------');

      return process.exit();
    } catch (error) {
      console.error(`Failed to retrieve stats, ${error}`);
    }
  }
  return null;
})();
