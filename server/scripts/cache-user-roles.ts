import { PromisePool } from '@supercharge/promise-pool';
import { AllRoles } from '../constants';
import { collections, dbClient } from '../db';
import keycloak from '../keycloak';

export const cacheUserRoles = async () => {
  const users = [];

  const keycloakUsers: { id: string }[] = await keycloak.getUsers(AllRoles);
  await PromisePool.for(keycloakUsers)
    .withConcurrency(10)
    .process(async (user) => {
      users.push({ ...user, roles: await keycloak.getUserRoles(user.id) });
    });

  if (users.length > 0) {
    let query = `INSERT INTO ${collections.USER_MIGRATION} (id, username, email, roles) VALUES `;
    query += users
      .filter((u) => u.roles.length)
      .map((u) => {
        const roles = u.roles.map((r) => `'${r}'`).join(',');
        return `('${u.id}', '${u.username}', '${u.email}', ARRAY[${roles}])`;
      })
      .join(',');

    await dbClient.db.query(query);
  }
};

(async function main() {
  if (require.main === module) {
    await keycloak.buildInternalIdMap();
    await dbClient.connect();
    await cacheUserRoles();
  }
})();
