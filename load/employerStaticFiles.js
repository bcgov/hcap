import http from 'k6/http';
import { fail } from 'k6';
import { Counter } from 'k6/metrics';
import { parseHTML } from 'k6/html';

const durationSeconds = __ENV.DURATION;
const rate = __ENV.RATE;

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
  const indexRes = http.get(`https://hcapemployers.${__ENV.OS_NAMESPACE_SUFFIX}.freshworks.club/`);

  if (indexRes.status === 200) {
    successCounter.add(1);
  }
  if (indexRes.status != 200) {
    failCounter.add(1);
    fail(`Failed: ${indexRes.status}, ${indexRes.body.trim()}`);
  }

  const doc = parseHTML(indexRes.body);
  const js = doc.find('script').toArray();
  for (const script of js) {
    const scriptPath = script.attr('src');
    const jsRes = http.get(
      `https://hcapemployers.${__ENV.OS_NAMESPACE_SUFFIX}.freshworks.club${scriptPath}`
    );
    if (jsRes.status === 200) {
      successCounter.add(1);
    }
    if (jsRes.status != 200) {
      failCounter.add(1);
      fail(`Failed: ${jsRes.status}, ${jsRes.body.trim()}`);
    }
  }
}
