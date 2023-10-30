/* eslint-disable camelcase */
import axios from 'axios';
import crypto from 'crypto';
import { JSDOM } from 'jsdom';
import querystring from 'querystring';
import { collections, dbClient } from '../../db';
import keycloak from '../../keycloak';
import logger from '../../logger';

export interface TestUser {
  username: string;
  password: string;
  email?: string;
}

export const superuser: TestUser = {
  username: 'test-superuser',
  password: process.env.KC_TEST_SUPER_USER_PWD || 'password',
};

export const employer: TestUser = {
  username: 'test-employer',
  password: process.env.KC_TEST_EMPLOYER_PWD || 'password',
};

export const mhsuEmployer: TestUser = {
  username: 'test-mhsu-employer',
  password: process.env.KC_TEST_EMPLOYER_PWD || 'password',
};

export const employerBceid: TestUser = {
  username: 'employer@bceid-basic-and-business',
  password: process.env.KC_TEST_EMPLOYER_PWD || 'password',
};

export const participant: TestUser = {
  username: 'test.participant',
  password: process.env.KC_TEST_PARTICIPANT_PWD || 'password',
  email: 'cristiano.ronaldo@hcap.club',
};

export const healthAuthority: TestUser = {
  username: 'test-ha',
  password: process.env.KC_TEST_HA_PWD || 'password',
};

export const ministryOfHealth: TestUser = {
  username: 'test-moh',
  password: process.env.KC_TEST_MOH_PWD || 'password',
};

const base64URLEncode = (str) =>
  str.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

const getAuthCodeFromLocation = (location) => {
  try {
    const url = new URL(location);
    const params = url.search.substring(1).split('&');

    for (let i = 0, p = params; i < p.length; i += 1) {
      const param = p[i];
      const [key, value] = param.split('=');
      if (key === 'code') {
        return value;
      }
    }
  } catch (e) {
    console.log(e);
  }
  return '';
};

export const getKeycloakToken = async ({ username, password }: TestUser) => {
  try {
    const code_challenge = base64URLEncode(crypto.randomBytes(32));
    // this redirect uri is only used for server tests
    const redirect_uri = 'http://hcapemployers.localhost:4000'; // NOSONAR
    const authBaseUrl = process.env.KEYCLOAK_AUTH_URL;
    const realm = process.env.KEYCLOAK_REALM;
    const client_id = process.env.KEYCLOAK_API_CLIENTID;
    const client_secret = process.env.KEYCLOAK_LOCAL_SECRET;

    // begin process for getting keycloak token with user info
    const response = await axios
      .get(`${authBaseUrl}/realms/${realm}/protocol/openid-connect/auth`, {
        params: {
          scope: 'openid',
          response_type: 'code',
          approval_prompt: 'auto',
          redirect_uri,
          client_id,
          client_secret,
          code_challenge_method: 'plain',
          code_challenge,
        },
        maxRedirects: 0,
      })
      .then((resp) => {
        // assign cookies from previous response
        const cookies = resp.headers['set-cookie'];
        // create fake dom to get form and action url
        const dom: JSDOM = new JSDOM(resp.data);
        const form: HTMLFormElement = dom.window.document.getElementsByTagName('form')[0];
        const url: HTMLFormElement['action'] = form.action;

        // assign cookies to request, set maxRedirects = 0 to prevent a redirect
        // and allow axios to be successful and continue with a 302 (redirect) status response
        const config = {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Cookie: cookies.join('; '),
          },
          withCredentials: true,
          maxRedirects: 0,
          validateStatus: (status: number) => status === 302,
        };

        return axios.post(
          url,
          querystring.stringify({
            username,
            password,
          }),
          config
        );
      })
      .then((resp) => {
        // get code from location header response
        const code = getAuthCodeFromLocation(resp.headers.location);

        const tokenUrl = `${authBaseUrl}/realms/${realm}/protocol/openid-connect/token`;
        const config = {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded', maxRedirects: 0 },
        };

        const tokenData = querystring.stringify({
          redirect_uri,
          client_id,
          client_secret,
          code,
          code_verifier: code_challenge,
          grant_type: 'authorization_code',
        });

        return axios.post(tokenUrl, tokenData, config);
      });

    // return valid token that contains user info
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

export const approveUsers = async (...users: TestUser[]) => {
  await Promise.all(
    users.map(async (user) => {
      const userInfo = await keycloak.getUser(user.username);
      await dbClient.db?.saveDoc(collections.USERS, {
        keycloakId: userInfo.id,
        sites: [1111, 4444, 7777],
        userInfo,
      });
    })
  );
};
