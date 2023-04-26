import { collections } from '../db';
import { Role } from '../constants';

exports.up = async (pgm) => {
  await pgm.db.query(`
    CREATE TABLE IF NOT EXISTS ${collections.USER_MIGRATION} (
      id uuid PRIMARY KEY,
      username VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      roles VARCHAR(30)[] NOT NULL,
      status VARCHAR(10) NOT NULL DEFAULT '${Role.Pending}',
      message VARCHAR(255),
      migrated_at timestamp with time zone
    )
  `);
};

exports.down = async (pgm) => {
  await pgm.db.query(`DROP TABLE ${collections.USER_MIGRATION}`);
};
