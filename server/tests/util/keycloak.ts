import axios from 'axios';
import querystring from 'querystring';
import logger from '../../logger';

export const superuser = {
  username: 'test-superuser',
  password: process.env.KC_TEST_SUPER_USER_PWD || 'password',
};

export const employer = {
  username: 'test-employer',
  password: process.env.KC_TEST_EMPLOYER_PWD || 'password',
};

export const participant = {
  username: 'test.participant',
  password: process.env.KC_TEST_PARTICIPANT_PWD || 'password',
};

export const healthAuthority = {
  username: 'test-ha',
  password: process.env.KC_TEST_HA_PWD || 'password',
};

export const ministryOfHealth = {
  username: 'test-moh',
  password: process.env.KC_TEST_MOH_PWD || 'password',
};

export const getKeycloakToken = async ({ username, password }) => {
  try {
    const data = querystring.stringify({
      grant_type: 'password',
      client_id: process.env.KEYCLOAK_FE_CLIENTID,
      username,
      password,
    });
    const authURL = process.env.KEYCLOAK_AUTH_URL;
    const url = `${authURL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`;
    const config = { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } };
    const response = await axios.post(url, data, config);
    return { Authorization: `Bearer ${response.data.access_token}` };
  } catch (error) {
    logger.error({
      context: `keycloak get token: ${error}`,
      user: {
        username,
        password,
      },
      error,
      resp: {
        statusText: error?.response?.statusText,
      },
    });
    throw error;
  }
};