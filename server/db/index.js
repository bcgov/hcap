const schemaFile = require('./schema');
const dbFile = require('./db');
const common = require('./common');

module.exports = {
  ...dbFile,
  ...schemaFile,
  ...common,
};
