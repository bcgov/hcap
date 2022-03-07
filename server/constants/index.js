const ros = require('./ros');
const validationConstants = require('./validation-constants');

module.exports = {
  ...validationConstants,
  ...ros,
};
