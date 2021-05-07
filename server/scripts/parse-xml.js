/* eslint-disable no-console, no-restricted-syntax, no-await-in-loop */
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const inquirer = require('inquirer');
const parser = require('fast-xml-parser');
const _ = require('lodash');
const asyncPool = require('tiny-async-pool');
const { validate, ParticipantFormSchema } = require('../validation');

const endpoints = [
  { name: 'Local', value: 'http://localhost:4000' },
  { name: 'Dev', value: 'https://hcap-server-rupaog-dev.pathfinder.gov.bc.ca' },
];

const postHcapSubmission = async (endpoint, data) => {
  const apiUrl = `${endpoint}/api/v1`;
  const response = await axios.post(`${apiUrl}/participant-form`, data);
  return response.data;
};

const getDirContent = (pathString) => {
  try {
    const fileNames = fs.readdirSync(pathString).filter((file) => file.slice(-4) === '.xml');
    const filesString = [];

    fileNames.forEach((name) => {
      const filePath = path.join(pathString, name);
      filesString.push({ name, content: fs.readFileSync(filePath).toString() });
    });

    return filesString;
  } catch (e) {
    if (typeof pathString === 'undefined')
      throw Error('Provide a path to a folder containing XMLs as the first command line argument');
    throw Error(`Could not read contents of file ${pathString}`);
  }
};

const fromXmlStrings = (xmlStrings) => parser.parse(xmlStrings);

const getUserInput = async () => {
  // Prompt user for query, output format
  const { 'Select Endpoint': endpoint } = await inquirer.prompt([
    { name: 'Select Endpoint', type: 'list', choices: endpoints },
  ]);
  const { Proceed: proceed } = await inquirer.prompt([{ name: 'Proceed', type: 'confirm' }]);
  if (!proceed) throw Error('User cancelled operation');
  return { endpoint };
};

const extractPreferredLocations = (preferredLocationString) => {
  const preferredLocations = preferredLocationString.split(' ');
  return preferredLocations.map((item) => {
    switch (item) {
      case 'Coastal':
        return 'Vancouver Coastal';
      case 'Island':
        return 'Vancouver Island';
      default:
        return item;
    }
  });
};

const extractOrbeonId = (name) =>
  name.match(
    /^Health Career Access Program - Expression of Interest - ([\w-]{16})( \([0-9]+\))?.xml$/
  )[1];

const makeTransactionIterator = (endpoint) => (d) => postHcapSubmission(endpoint, d);

// run: node parse-xml ./folder-containing-xml-files
// run mocks: node parse-xml ../tests/mock/xml
(async () => {
  let currentFile;
  try {
    const xmlStrings = getDirContent(process.argv[2]);
    const parsedJsonObjs = [];
    const validationErrors = [];
    for (const xml of xmlStrings) {
      currentFile = xml;
      const jsonObj = fromXmlStrings(xml.content);
      let orbeonId;
      try {
        orbeonId = extractOrbeonId(xml.name);
      } catch (e) {
        validationErrors.push({ fileName: xml.name, error: 'Invalid file name.' });
      }
      const parsedJsonObj = {
        orbeonId,
        eligibility: _.get(jsonObj, 'form.eligibility.grid-7.legallyEligible') === 'Yes',
        firstName: _.get(jsonObj, 'form.contactInformation.grid-1.firstName'),
        lastName: _.get(jsonObj, 'form.contactInformation.grid-1.lastName'),
        phoneNumber: _.get(jsonObj, 'form.contactInformation.grid-1.phoneNumber').toString(),
        emailAddress: _.get(jsonObj, 'form.contactInformation.grid-1.emailAddress'),
        postalCode: _.get(jsonObj, 'form.contactInformation.grid-1.postalCode'),
        preferredLocation: extractPreferredLocations(
          _.get(jsonObj, 'form.locationPreference.grid-2.healthRegion')
        ),
        consent: _.get(jsonObj, 'form.consent.grid-3.confirmed') === 'Yes',
      };
      try {
        await validate(ParticipantFormSchema, parsedJsonObj);
        parsedJsonObjs.push(parsedJsonObj);
      } catch (e) {
        validationErrors.push({ fileName: xml.name, error: e.message });
      }
    }

    console.log(`Parsed ${parsedJsonObjs.length} file(s) of ${xmlStrings.length}.`);

    if (parsedJsonObjs.length === 0) {
      console.error('No XML files to parse.');
      return;
    }

    if (validationErrors.length > 0) {
      console.error(`Found ${validationErrors.length} invalid file(s) of ${xmlStrings.length}.`);
      validationErrors.forEach((item) =>
        console.error(`---\nFile: ${item.fileName}\nError: ${item.error}`)
      );
      return;
    }

    const { endpoint } = await getUserInput();
    const interactor = makeTransactionIterator(endpoint);
    const results = await asyncPool(10, parsedJsonObjs, interactor);
    console.log(results.map((item) => (item ? item.id : null)));
    console.log(`Sent ${results.filter((item) => item).length} item(s) to HCAP.`);
  } catch (error) {
    if (!currentFile) {
      console.error('\x1b[31m', 'Invalid XML folder.');
    } else {
      console.error('\x1b[31m', `File error: ${currentFile.name}`);
    }
    console.log('\x1b[0m');
    console.error(error.isAxiosError || error.ValidationError ? error.message : error);
  }
})();
