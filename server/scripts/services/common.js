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
  // Try JSON parsing first
  try {
    const serviceConfig = JSON.parse(decoded);
    console.log('JSON base service config');
    return serviceConfig;
  } catch (error) {
    console.log('Not Json format: Trying as prop string');
  }
  // Parse
  const items = decoded.split(';') || [];
  const config = {};
  items.forEach((item) => {
    const [key, value] = item.trim().split('=');
    if (key && value) {
      if (!Number.isNaN(+value.trim())) {
        config[key.trim()] = +value.trim();
      } else {
        config[key.trim()] = value.trim();
      }
    }
  });
  return config;
};

module.exports = {
  optionValidator,
  processServiceConfig,
};
