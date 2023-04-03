/* eslint-disable camelcase,no-await-in-loop,no-restricted-syntax,no-console */
import axios from 'axios';
import _ from 'lodash';
import querystring from 'querystring';
import { PromisePool } from '@supercharge/promise-pool';
import { dbClient } from '../db';

interface AccessConfig {
  auth_url: string;
  api_url?: string;
  realm: string;
  client_id: string;
  fe_client_id: string;
  client_secret: string;
  username: string;
  password: string;
}

interface User {
  id: string;
  username: string;
  attributes?: {
    idir_userid?: string;
    bceid_userid?: string;
  };
}

const SOURCE_CONFIG: AccessConfig = {
  realm: process.env.KEYCLOAK_REALM,
  auth_url: process.env.KEYCLOAK_AUTH_URL,
  client_id: process.env.KEYCLOAK_API_CLIENTID,
  fe_client_id: process.env.KEYCLOAK_FE_CLIENTID,
  client_secret: process.env.KEYCLOAK_API_SECRET,
  username: process.env.KEYCLOAK_SA_USERNAME,
  password: process.env.KEYCLOAK_SA_PASSWORD,
};

const TARGET_CONFIG: AccessConfig = {
  realm: process.env.TARGET_KEYCLOAK_REALM,
  auth_url: process.env.TARGET_KEYCLOAK_AUTH_URL,
  client_id: process.env.TARGET_KEYCLOAK_API_CLIENTID,
  fe_client_id: process.env.TARGET_KEYCLOAK_FE_CLIENTID,
  client_secret: process.env.TARGET_KEYCLOAK_API_SECRET,
  username: process.env.TARGET_KEYCLOAK_SA_USERNAME,
  password: process.env.TARGET_KEYCLOAK_SA_PASSWORD,
};

if (TARGET_CONFIG.realm === 'moh_applications') {
  TARGET_CONFIG.api_url = process.env.TARGET_KEYCLOAK_API_URL;
}

const POOL_SIZE = 10;

const getToken = async (config: AccessConfig): Promise<string> => {
  const { auth_url, realm, client_id, client_secret, username, password } = config;

  const url = `${auth_url}/realms/${realm}/protocol/openid-connect/token`;
  const grant_type = realm === 'moh_applications' ? 'client_credentials' : 'password';
  const data = querystring.stringify({
    grant_type,
    client_id,
    client_secret,
    username,
    password,
  });

  const response = await axios.post(url, data, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return response.data?.access_token;
};

const getApiUrl = (config: AccessConfig): string => {
  const { api_url, auth_url, realm } = config;
  if (api_url) {
    return `${api_url}`;
  }
  return `${auth_url}/admin/realms/${realm}`;
};

const getUserCount = async (config: AccessConfig, token: string): Promise<number> => {
  const url = `${getApiUrl(config)}/users/count`;

  const { data: count } = await axios.get(`${url}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return count;
};

const getUsersByOffset = async (
  config: AccessConfig,
  token: string,
  offset: number,
  size: number
): Promise<User[]> => {
  const url = `${getApiUrl(config)}/users?briefPresentation=true&first=${offset}&max=${size}`;

  const response = await axios.get(`${url}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

const getUsers = async (config: AccessConfig, token: string): Promise<User[]> => {
  const total = await getUserCount(config, token);

  console.log(`fetching ${total} users from ${config.auth_url}`);

  const users = [];
  await PromisePool.for(_.range(total / POOL_SIZE))
    .withConcurrency(POOL_SIZE)
    .process(async (__, index, pool) => {
      const result = await getUsersByOffset(config, token, index * POOL_SIZE, POOL_SIZE);
      users.push(...result);
    });
  return users;
};

const getUserById = async (config: AccessConfig, id: string, token: string): Promise<User> => {
  const url = getApiUrl(config);

  const response = await axios.get(`${url}/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

const getUserByName = async (
  config: AccessConfig,
  username: string,
  token: string
): Promise<User> => {
  const url = `${getApiUrl(config)}/users?briefPresentation=true&max=1&username=${username}`;

  const response = await axios.get(`${url}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data[0];
};

const insertUser = async (config: AccessConfig, user: any, token: string): Promise<void> => {
  const url = getApiUrl(config);

  await axios.post(`${url}/users`, user, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

const checkVariables = (config: AccessConfig, name: string): void => {
  console.log(`${name.toUpperCase()} ACCESS CONFIG`);
  console.table(config);

  Object.entries(config).forEach(([key, value]) => {
    if (!value) {
      console.error(`'${key}' of ${name} is not set`);
      process.exit(1);
    }
  });
};

const getClients = async (config: AccessConfig, token: string) => {
  const url = `${getApiUrl(config)}/clients`;

  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

const getClientUuid = async (config: AccessConfig, token, clientId: string): Promise<string> => {
  const clients = await getClients(config, token);
  const client = clients.find((c) => c.clientId === clientId);
  return client?.id;
};

const getUserRoles = async (
  config: AccessConfig,
  id: string,
  token: string,
  clientGuid: string
) => {
  const url = `${getApiUrl(config)}/users/${id}/role-mappings/clients/${clientGuid}`;

  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

const getClientRoles = async (config: AccessConfig, token: string, clientGuid: string) => {
  const url = `${getApiUrl(config)}/clients/${clientGuid}/roles`;

  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

const updateUserRoles = async (
  config: AccessConfig,
  userId: string,
  clientGuid: string,
  roles: any[],
  token: string
) => {
  const url = `${getApiUrl(config)}/users/${userId}/role-mappings/clients/${clientGuid}`;

  await axios.post(url, roles, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

const printUsersStats = (users: User[]) => {
  const stats = {
    users: users.length,
    idir: users.filter((u) => u.attributes?.idir_userid).length,
    bceid: users.filter((u) => u.attributes?.bceid_userid).length,
  };

  console.table(stats);
};

const COMMAND_OPTIONS = [
  '--print-users', // print user statistics
  '--database', // migrate database
  '--keycloak', // migrate keycloak users
];

const checkOption = (option: string) => {
  if (!COMMAND_OPTIONS.includes(option)) {
    console.error('Command option is required.');
    console.error(`${process.argv[0]} ${process.argv[1]} [${COMMAND_OPTIONS.join('|')}]`);
    process.exit(1);
  }
};

const changeUserId = async (oldId: string, newId: string): Promise<void> => {
  await dbClient.db.withTransaction(async (tx) => {
    // // update users.userInfo.id
    let rows = await tx.query(`
      SELECT body
      FROM users
      WHERE body -> 'userInfo' ->> 'id' = '${oldId}';
    `);
    for (const row of rows) {
      row.body.userInfo.id = newId;
      await tx.query(`
        UPDATE users
        SET body = '${JSON.stringify(row.body)}'
        WHERE body -> 'userInfo' ->> 'id' = '${oldId}';
      `);
    }

    // update participants_status.employer_id
    await tx.query(`
      UPDATE participants_status
      SET employer_id = '${newId}'
      WHERE employer_id = '${oldId}';
    `);

    // update participants_status.data.hiddenForUserIds
    rows = await tx.query(`
      SELECT id, data
      FROM participants_status
      WHERE data -> 'hiddenForUserIds' ->> '${oldId}' IS NOT null;
    `);
    for (const row of rows) {
      row.data.hiddenForUserIds[newId] = row.data.hiddenForUserIds[oldId];
      delete row.data.hiddenForUserIds[oldId];
      await tx.query(`
        UPDATE participants_status
        SET data = '${JSON.stringify(row.data)}'
        WHERE
          id = '${row.id}' AND
          data -> 'hiddenForUserIds' ->> '${oldId}' IS NOT null;
      `);
    }
  });
};

const migrateDatabase = async (sourceUsers: User[], targetUsers: Record<string, User>) => {
  // check if all users are defined on the target keycloak
  const unMappedUsers = sourceUsers.filter((u) => !targetUsers[u.username]);
  if (unMappedUsers.length) {
    console.error(`${unMappedUsers.length} users not found on the target keycloak`);
    process.exit(1);
  }

  const idMap = sourceUsers.map((u) => [u.id, targetUsers[u.username].id]);

  await dbClient.connect();

  await PromisePool.for(idMap)
    .withConcurrency(POOL_SIZE)
    .handleError(async (error, user, pool) => {
      if (error) {
        console.error(error);
        pool.stop();
      }
    })
    .onTaskFinished((user, pool) => {
      const progress = `Progress: ${Math.round(pool.processedPercentage())}%`;
      process.stdout.cursorTo(0);
      process.stdout.write(`${progress}: ${pool.processedCount()}/${sourceUsers.length}`);
    })
    .process(([oldId, newId]) => changeUserId(oldId, newId));
};

(async function migrateUsers() {
  const option = process.argv[2];
  checkOption(option);

  checkVariables(SOURCE_CONFIG, 'source keycloak');

  const sourceToken = await getToken(SOURCE_CONFIG);
  const sourceUsers = await getUsers(SOURCE_CONFIG, sourceToken);

  if (option === COMMAND_OPTIONS[0]) {
    printUsersStats(sourceUsers);
    return;
  }

  checkVariables(TARGET_CONFIG, 'target keycloak');

  const targetToken = await getToken(TARGET_CONFIG);
  const targetUsers = _.chain(await getUsers(TARGET_CONFIG, targetToken))
    .keyBy('username')
    .mapValues()
    .value();

  if (option === COMMAND_OPTIONS[1]) {
    await migrateDatabase(sourceUsers, targetUsers);
    return;
  }

  const sourceClientGuid = await getClientUuid(
    SOURCE_CONFIG,
    sourceToken,
    SOURCE_CONFIG.fe_client_id
  );

  const targetClientGuid = await getClientUuid(
    TARGET_CONFIG,
    targetToken,
    TARGET_CONFIG.fe_client_id
  );

  const targetClientRoles = await getClientRoles(TARGET_CONFIG, targetToken, targetClientGuid);

  // migrate users
  let dropped = 0;
  let created = 0;

  const syncUser = async (user) => {
    const active = user.attributes?.bceid_userid?.length || user.attributes?.idir_userid?.length;
    if (user.username && active) {
      const targetUser = targetUsers[user.username];

      let newUser = targetUser;
      if (!newUser) {
        const details = await getUserById(SOURCE_CONFIG, user.id, sourceToken);
        await insertUser(TARGET_CONFIG, details, targetToken);
        newUser = await getUserByName(TARGET_CONFIG, user.username, targetToken);
        created += 1;
      }

      // get users roles on source keycloak
      const roles = await getUserRoles(SOURCE_CONFIG, user.id, sourceToken, sourceClientGuid);

      // need role id on the target keycloak
      const targetRoles = targetClientRoles.filter(({ name }) =>
        roles.some((r) => r.name === name)
      );
      await updateUserRoles(
        TARGET_CONFIG,
        newUser.id,
        targetClientGuid,
        targetRoles.map((r) => _.pick(r, ['id', 'name'])),
        targetToken
      );
    } else {
      dropped += 1;
    }
  };

  await PromisePool.for(sourceUsers)
    .withConcurrency(POOL_SIZE)
    .handleError(async (error, user, pool) => {
      if (error) {
        console.error(error);
        pool.stop();
      }
    })
    .onTaskFinished((user, pool) => {
      const progress = `Progress: ${Math.round(pool.processedPercentage())}%`;
      process.stdout.cursorTo(0);
      process.stdout.write(`${progress}: ${pool.processedCount()}/${sourceUsers.length}`);
    })
    .process(syncUser);

  console.log();
  console.log(`Created ${created} users`);
  console.log(`Dropped ${dropped} users`);
})();
