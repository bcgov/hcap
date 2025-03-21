/* eslint-disable no-console */
import minimist from 'minimist';
import * as services from './services';
import { processServiceConfig } from './services/common';
import { dbClient } from '../db';

// Parsing arguments
const argv = minimist(process.argv.slice(2));

// CLI execution entry point
(async () => {
  try {
    const { service: cmdService } = argv;
    let service;
    let serviceOptions;
    if (!cmdService) {
      // Try load service config from env
      const envService = process.env.SERVICE_CONFIG;
      console.log(`Loading service config from env: ${envService}`);
      serviceOptions = processServiceConfig(envService || '');
      console.log(`Service config: ${JSON.stringify(serviceOptions)}`);
      if (serviceOptions.service) {
        service = serviceOptions.service;
      } else {
        console.log('Please provide a service to run');
        console.log('Usage: node cli.js --service=<service>');
        process.exit(1);
      }
    } else {
      service = cmdService;
      serviceOptions = argv;
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
      const result = await services[service](serviceOptions);
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
  } catch (error) {
    console.log(`Failed to run cli: ${error}`);
    process.exit(1);
  }
})();
