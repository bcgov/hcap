/** Wrapper for `feed-data` to specifically feed participants */
import './load-env';
import { feedData } from './feed-data';
import { collections } from '../db';

// WARN: does not enforce certain constraints from source file!
// Ensure your input file does not, for example, contain invalid values where it shouldn't.

if (require.main === module) {
  feedData([
    {
      table: collections.PARTICIPANTS,
      fileName: process.argv[2] ?? 'participants.csv',
    },
  ]);
}
