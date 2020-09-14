const fs = require('fs');
const path = require('path');
const axios = require('axios');
const inquirer = require('inquirer');
const parser = require('fast-xml-parser');
const _ = require('lodash');
const asyncPool = require('tiny-async-pool');

const endpoints = [
  { name: 'Local', value: 'http://localhost' },
  { name: 'Dev', value: 'http://hcap-server-server-rupaog-dev.pathfinder.gov.bc.ca' },
];

const postHcapSubmission = async (endpoint, data) => {
  const apiUrl = `${endpoint}/api/v1`;
  try {
    const response = await axios.post(`${apiUrl}/form`, data);
    return response.data;
  } catch (e) {
    return null;
  }
};

const getDirContent = (pathString) => {
  try {
    const fileNames = fs.readdirSync(pathString).filter((file) => (file.slice(-4) === '.xml'));
    const filesString = [];

    fileNames.forEach((name) => {
      const filePath = path.join(pathString, name);
      filesString.push(fs.readFileSync(filePath).toString());
    });

    return filesString;
  } catch (e) {
    if (typeof pathString === 'undefined') throw Error('Provide a path to a folder containing XMLs as the first command line argument');
    throw Error(`Could not read contents of file ${pathString}`);
  }
};

const fromXmlStrings = (xmlStrings) => parser.parse(xmlStrings);

const getUserInput = async () => { // Prompt user for query, output format
  const { 'Select Endpoint': endpoint } = await inquirer.prompt([{ name: 'Select Endpoint', type: 'list', choices: endpoints }]);
  const { Proceed: proceed } = await inquirer.prompt([{ name: 'Proceed', type: 'confirm' }]);
  if (!proceed) throw Error('User cancelled operation');
  return { endpoint };
};

const makeTransactionIterator = (endpoint) => (d) => postHcapSubmission(endpoint, d);

// run: node parse-xml ./folder-containing-xml-files
/* eslint-disable no-console */
(async () => {
  try {
    const xmlStrings = getDirContent(process.argv[2]);
    const parsedJsonObjs = [];
    xmlStrings.forEach((xml) => {
      const jsonObj = fromXmlStrings(xml);
      const parsedJsonObj = {
        // number: _.get(jsonObj, 'form.formControl.grid-4.number'),
        eligibility: _.get(jsonObj, 'form.section-3.grid-7.legallyEligible') === 'Yes',
        firstName: _.get(jsonObj, 'form.contactInformation.grid-1.firstName'),
        lastName: _.get(jsonObj, 'form.contactInformation.grid-1.lastName'),
        phoneNumber: _.get(jsonObj, 'form.contactInformation.grid-1.primaryPhone').toString(),
        emailAddress: _.get(jsonObj, 'form.formControl.grid-4.recipient'),
        postalCode: _.get(jsonObj, 'form.contactInformation.grid-1.postalCode'),
        preferredLocation: [_.get(jsonObj, 'form.locationPreference.grid-2.healthRegion')],
        consent: _.get(jsonObj, 'form.consent.grid-3.confirmed') === 'Yes',
      };
      parsedJsonObjs.push(parsedJsonObj);
    });
    console.log(`Parsed ${parsedJsonObjs.length} files.`);
    const { endpoint } = await getUserInput();
    const interactor = makeTransactionIterator(endpoint);
    const results = await asyncPool(10, parsedJsonObjs, interactor);
    console.log(results);
    console.log(`Sent ${results.filter((item) => item).length} items to HCAP.`);
  } catch (error) {
    console.error(error.isAxiosError ? error.message : error);
  }
})();
