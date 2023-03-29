/* eslint-disable camelcase,no-await-in-loop,no-restricted-syntax,no-console */
import axios from 'axios';
import querystring from 'querystring';

interface AccessConfig {
  auth_url: string;
  api_url?: string;
  realm: string;
  client_id: string;
  client_secret: string;
  username: string;
  password: string;
}

const SOURCE_CONFIG: AccessConfig = {
  realm: process.env.KEYCLOAK_REALM,
  auth_url: process.env.KEYCLOAK_AUTH_URL,
  client_id: process.env.KEYCLOAK_API_CLIENTID,
  client_secret: process.env.KEYCLOAK_API_SECRET,
  username: process.env.KEYCLOAK_SA_USERNAME,
  password: process.env.KEYCLOAK_SA_PASSWORD,
};

const TARGET_CONFIG: AccessConfig = {
  realm: process.env.TARGET_KEYCLOAK_REALM,
  auth_url: process.env.TARGET_KEYCLOAK_AUTH_URL,
  client_id: process.env.TARGET_KEYCLOAK_API_CLIENTID,
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
    return `${api_url}/users`;
  }
  return `${auth_url}/admin/realms/${realm}/users`;
};

const getUsers = async (config: AccessConfig, token: string) => {
  const url = getApiUrl(config);
  const response = await axios.get(`${url}?max=1000000`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

const insertUser = async (config: AccessConfig, user: any, token: string) => {
  const url = getApiUrl(config);

  await axios.post(url, user, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

const updateUser = async (config: AccessConfig, user: any, update: any, token: string) => {
  const url = getApiUrl(config);

  await axios.put(`${url}/${user.id}`, update, {
    headers: { Authorization: `Bearer ${token}` },
  });
};

const checkVariables = (config: AccessConfig, name: string) => {
  console.log(`${name.toUpperCase()} ACCESS CONFIG`);
  console.table(config);
  Object.entries(config).forEach(([key, value]) => {
    if (!value) {
      console.error(!!value, `'${key}' of ${name} is not set`);
      process.exit(1);
    }
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

  // migrate users
  let created = 0;
  let updated = 0;
  for (const user of sourceUsers) {
    if (user.username) {
      const targetUser = targetUsers.find(
        (u) => u.username.toLowerCase() === user.username.toLowerCase()
      );

      if (targetUser) {
        await updateUser(TARGET_CONFIG, targetUser, user, targetToken);
        updated += 1;
      } else {
        await insertUser(TARGET_CONFIG, user, targetToken);
        created += 1;
      }
    }
  }

  console.log(`${created} users created, ${updated} users updated`);
})();
