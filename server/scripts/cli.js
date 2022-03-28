/* eslint-disable no-console */
const minimist = require('minimist');
const services = require('./services');
const { dbClient } = require('../db');

// Parsing arguments
const argv = minimist(process.argv.slice(2));

// CLI execution entry point
(async () => {
  const { service } = argv;
  if (!service) {
    console.log('Please provide a service to run');
    console.log('Usage: node cli.js --service=<service>');
    process.exit(1);
  }
  if (!services[service]) {
    console.log(`Service '${service}' does not exist`);
    process.exit(1);
    return;
  }

  try {
    await dbClient.connect();
    console.log(`Connected to database`);
  } catch (err) {
    console.log(`Failed to connect to database: ${err}`);
    process.exit(1);
  }

  try {
    const result = await services[service](argv);
    if (!result.success) {
      console.log(result.message);
      if (result.usageMessage) {
        console.log(`Usage: node cli.js --service=${service} ${result.usageMessage}`);
      }
      process.exit(1);
    }
    console.log(`${service} completed successfully with message: ${result.message}`);
    process.exit(0);
  } catch (error) {
    console.log(`Failed to run service '${service}': ${error}`);
    process.exit(1);
  }
})();
