import http from 'k6/http';
import { fail } from 'k6';
import { Counter } from 'k6/metrics';

const durationSeconds = 120;
const rate = 125;

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
      maxVUs: rate * 2,
    },
  },
};

let token = null;

const fetchToken = () => {
  // if (!token) {
  const credentials = {
    username: 'hcap.four@bcsc',
    password: '1234',
    grant_type: 'password',
    client_id: 'hcap-fe',
  };
  const authParams = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };
  const authUrl = 'https://dev.oidc.gov.bc.ca/auth/realms/4qjrpzzl/protocol/openid-connect/token';

  const authRes = http.post(authUrl, credentials, authParams);
  token = authRes.json().access_token;
  // console.log(token);
  // }
};

export default function () {
  console.log(__ITER);
  // if (__ITER === 0) {
  fetchToken();
  // }
  var urls = [
    `https://hcapparticipants.dev.freshworks.club/api/v1/user`,
    `https://hcapparticipants.dev.freshworks.club/api/v1/participant-user/participants`,
  ];

  var params = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  for (const url of urls) {
    const res = http.get(url, params);
    if (res.status === 200) {
      successCounter.add(1);
    }
    if (res.status != 200) {
      failCounter.add(1);
      fail(`Failed: ${res.status}, ${res.body}`);
    }
  }
}
