/* eslint-disable no-console */
const { Buffer } = require('buffer');
(() => {
  const serviceConfig = process.env.SERVICE_CONFIG_INPUT;
  const base = Buffer.from(serviceConfig);
  const baseStr = base.toString('base64');
  console.log(baseStr);
})();
