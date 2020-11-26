/** Exporting */
const common = require('./common');
const employerSiteSchema = require('./employerSiteSchema');

module.exports = {
  ...common,
  ...employerSiteSchema,
};
