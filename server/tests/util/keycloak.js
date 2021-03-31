const axios = require('axios');
const querystring = require('querystring');

const superuser = { username: 'test-admin', password: 'password' };
const employer = { username: 'test-employer', password: 'password' };

const getKeycloakToken = async ({ username, password }) => {
  const data = querystring.stringify({
    grant_type: 'password',
    client_id: process.env.KEYCLOAK_FE_CLIENTID,
    username,
    password,
  });
  const url = `${process.env.KEYCLOAK_AUTH_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`;
  const config = { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } };
  const response = await axios.post(url, data, config);
  return { Authorization: `Bearer ${response.data.access_token}` };
};

module.exports = { superuser, employer, getKeycloakToken };
