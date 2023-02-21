/**
 * This is simply a pre-load module to call `dotenv` before a script.
 * This keeps scripts tidy, and ESLint happy.
 */

import * as dotenv from 'dotenv';

dotenv.config({ path: '../.env' });
