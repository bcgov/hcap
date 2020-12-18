/* eslint-disable no-console */
// To use this, login to the app and copy your JWT from local storage
// Run `export TOKEN=[YOUR_TOKEN]` before running `node scripts/load-test.js`
const axios = require('axios');
const asyncPool = require('tiny-async-pool');
const { performance } = require('perf_hooks');

const url = 'https://hcap-server-rupaog-dev.pathfinder.gov.bc.ca/api/v1/participants';
const concurrent = 5;
const total = 10;

const request = async (i) => {
  const start = performance.now();
  let status;
  try {
    const config = { headers: { Authorization: `Bearer ${process.env.TOKEN}` } };
    const response = await axios.get(url, config);
    status = response.status;
  } catch (error) {
    status = error.response.status;
  } finally {
    const time = (performance.now() - start).toFixed(0);
    console.log(`Request ${i}: ${status} (${time}ms)`);
  }
};

(async () => {
  console.log(`Hitting endpoint ${url}\n${concurrent} concurrent request(s)\n${total} total request(s)`);
  const data = [...Array(total).keys()];
  await asyncPool(concurrent, data, request);
})();
