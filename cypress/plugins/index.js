/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

/**
 * @type {Cypress.PluginConfig}
 */
const dotenvPlugin = require('cypress-dotenv');

/**
 * This function is called when a project is opened or re-opened (e.g. due to
 * the project's config changing)
 *
 * @param {*} on used to hook into various events Cypress emits
 * @param {*} config the resolved Cypress config
 */
module.exports = (on, config) => {
  // The first parameter is the config, the second parameter is the dotenv
  // config, and the third parameter specifies ALL env variables
  config = dotenvPlugin(config, {}, true);
  return config;
};
