/* eslint-disable no-console */
const { Buffer } = require('buffer');

const optionValidator = ({ options, keys = [] }) => {
  const requiredKeys = [];
  const usage = [];
  keys.forEach((key) => {
    if (!options[key]) {
      requiredKeys.push(key);
      usage.push(`--${key}=<${key}>`);
    }
  });
  if (requiredKeys.length > 0) {
    const message = `Please provide ${requiredKeys.join(', ')}`;
    const usageMessage = `${usage.join(' ')}`;
    return [false, message, usageMessage];
  }
  return [true, ''];
};

const processServiceConfig = (configStr) => {
  // Decode
  const buffer = Buffer.from(configStr, 'base64');
  const decoded = buffer.toString('utf8');
  console.log(`Decoded Service Config: ${decoded}`);
  // Parse
  const items = decoded.split(';') || [];
  const config = {};
  items.forEach((item) => {
    const [key, value] = item.split('=');
    if (!Number.isNaN(+value)) {
      config[key] = +value;
    } else {
      config[key] = value;
    }
  });
  return config;
};

module.exports = {
  optionValidator,
  processServiceConfig,
};
