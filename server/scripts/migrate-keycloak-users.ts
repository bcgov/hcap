/* eslint-disable camelcase,no-await-in-loop,no-restricted-syntax,no-console */
import axios from 'axios';
import _ from 'lodash';
import querystring from 'querystring';

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

const getUsers = async (config: AccessConfig, token: string) => {
  const url = `${getApiUrl(config)}/users?briefPresentation=true&max=10000`;

  const response = await axios.get(`${url}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

const getUserById = async (config: AccessConfig, id: string, token: string): Promise<void> => {
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
): Promise<string> => {
  const url = `${getApiUrl(config)}/users?briefPresentation=true&max=1&username=${username}`;

  const response = await axios.get(`${url}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data[0];
};

const insertUser = async (config: AccessConfig, user: any, token: string) => {
  const url = getApiUrl(config);

  await axios.post(`${url}/users`, user, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

const checkVariables = (config: AccessConfig, name: string) => {
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

(async function () {
  checkVariables(SOURCE_CONFIG, 'source keycloak');
  checkVariables(TARGET_CONFIG, 'target keycloak');

  const sourceToken = await getToken(SOURCE_CONFIG);
  const sourceUsers = await getUsers(SOURCE_CONFIG, sourceToken);

  const targetToken = await getToken(TARGET_CONFIG);
  const targetUsers = await getUsers(TARGET_CONFIG, targetToken);

  console.log(`${sourceUsers.length} users from the source`);
  console.log(`${targetUsers.length} users from the target`);

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
  for (const user of sourceUsers) {
    if (user.username) {
      const targetUser = targetUsers.find(
        (u) => u.username.toLowerCase() === user.username.toLowerCase()
      );

      let newUser = targetUser;
      if (!newUser) {
        const details = await getUserById(SOURCE_CONFIG, user.id, sourceToken);
        await insertUser(TARGET_CONFIG, details, targetToken);
        newUser = await getUserByName(TARGET_CONFIG, user.username, targetToken);
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
      console.log(
        `update user '${user.username}' roles: `,
        targetRoles.map((r) => r.name)
      );
    }
  }
})();
