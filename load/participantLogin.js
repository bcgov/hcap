import http from 'k6/http';
import { fail } from 'k6';
import { Counter } from 'k6/metrics';

const durationSeconds = __ENV.DURATION;
const rate = __ENV.RATE;

const KC_USER = {
  username: __ENV.LOAD_KC_AUTH_USERNAME,
  password: __ENV.LOAD_KC_AUTH_PASSWORD,
  clientId: __ENV.LOAD_KC_AUTH_CLIENTID,
};

const GET_ROUTES = [
  `https://hcapparticipants.${__ENV.OS_NAMESPACE_SUFFIX}.freshworks.club/api/v1/user`,
  `https://hcapparticipants.${__ENV.OS_NAMESPACE_SUFFIX}.freshworks.club/api/v1/participant-user/participants`,
];

const authUrl = `https://${__ENV.OS_NAMESPACE_SUFFIX}.oidc.gov.bc.ca/auth/realms/${__ENV.KEYCLOAK_REALM}/protocol/openid-connect/token`;

let successCounter = new Counter('SUCCESS_REQS');
let failCounter = new Counter('FAIL_REQS');

export let options = {
  insecureSkipTLSVerify: true,
  scenarios: {
    all: {
      executor: 'constant-arrival-rate',
      rate,
      timeUnit: '1s',
      duration: `${durationSeconds}s`,
      preAllocatedVUs: 0,
      maxVUs: rate,
    },
  },
};

let token = null;

const fetchToken = () => {
  const credentials = {
    username: KC_USER.username,
    password: KC_USER.password,
    client_id: KC_USER.clientId,
    grant_type: 'password',
  };
  const authParams = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const authRes = http.post(authUrl, credentials, authParams);
  token = authRes.json().access_token;
};

export default function () {
  fetchToken();

  var params = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  for (const route of GET_ROUTES) {
    const res = http.get(route, params);
    if (res.status === 200) {
      successCounter.add(1);
    }
    if (res.status != 200) {
      failCounter.add(1);
      fail(`Failed: ${res.status}, ${res.body.trim()}`);
    }
  }
}
