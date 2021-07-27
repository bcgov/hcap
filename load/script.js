import http from 'k6/http';
import { fail } from 'k6';
import { Counter } from 'k6/metrics';

const durationSeconds = 30;
const rate = 333;

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

export default function () {
  var url = `${__ENV.HOST}/api/v1/version`;
  var payload = JSON.stringify({
    firstName: 'Verona',
    lastName: 'Mann',
    dob: '1990-10-10',
    postal: 'A1A 1A1',
    phone: '6135550112',
    email: 'Andre_Bergnaum@hotmail.com',
    contact: 'sms',
    certify: true,
    phn: '9130560412',
  });

  var params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const res = http.get(url);
  if (res.status === 200) {
    successCounter.add(1);
  }
  if (res.status != 200) {
    failCounter.add(1);
    fail(`Failed: ${res.status}, ${res.body}`);
  }
}
