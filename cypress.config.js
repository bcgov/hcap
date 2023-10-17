const { defineConfig } = require('cypress');

module.exports = defineConfig({
  chromeWebSecurity: false,
  trashAssetsBeforeRuns: true,
  video: false,
  isLocal: false,
  env: {
    apiBaseURL: 'http://hcapemployers.local.freshworks.club:8081/api/v1',
    participantBaseUrl: 'http://hcapparticipants.local.freshworks.club:4000',
  },
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.js')(on, config);
    },
    specPattern: 'cypress/integration/**/*.spec.js',
    baseUrl: 'http://hcapemployers.local.freshworks.club:4000',
  },
  viewportWidth: 1600,
  viewportHeight: 1024,
});
