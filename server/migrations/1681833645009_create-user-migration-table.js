import { PromisePool } from '@supercharge/promise-pool';
import keycloak from '../keycloak';
import { collections } from '../db';

exports.shorthands = undefined;

exports.up = async (pgm) => {
  const users = [];

  const keycloakUsers = await keycloak.getUsers();
  await PromisePool.for(keycloakUsers)
    .withConcurrency(10)
    .process(async (user) => {
      users.push({ ...user, roles: await keycloak.getUserRoles(user.id) });
    });

  await pgm.db.query(`
    CREATE TABLE IF NOT EXISTS ${collections.USER_MIGRATION} (
      id uuid PRIMARY KEY,
      username VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      roles VARCHAR(30)[] NOT NULL,
      status VARCHAR(10) NOT NULL DEFAULT 'pending',
      migrated_at timestamp with time zone
    )
  `);

  if (users.length > 0) {
    let query = `INSERT INTO ${collections.USER_MIGRATION} (id, username, email, roles) VALUES `;
    query += users
      .filter((u) => u.roles.length)
      .map((u) => {
        const roles = u.roles.map((r) => `'${r}'`).join(',');
        return `('${u.id}', '${u.username}', '${u.email}', ARRAY[${roles}])`;
      })
      .join(',');

    await pgm.db.query(query);
  }
};

exports.down = async (pgm) => {
  await pgm.db.query(`DROP TABLE ${collections.USER_MIGRATION}`);
};
