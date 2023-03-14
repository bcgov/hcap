/** Wrapper for `feed-data` to specifically feed sites */
import './load-env';
import { feedData } from './feed-data';
import { collections } from '../db';

if (require.main === module) {
  feedData([
    {
      table: collections.EMPLOYER_SITES,
      fileName: process.argv[2] ?? 'employer_sites.csv',
    },
  ]);
}
