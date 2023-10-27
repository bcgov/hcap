import { faker } from '@faker-js/faker';
import _ from 'lodash';
import { convertToCsv } from './services/participant-seed';
import { healthRegions, Program, yesOrNo } from '../constants';

// this is for canadian postal codes
faker.locale = 'en_CA';

const NUM_PARTICIPANTS_TO_GENERATE = 500;

// increment id for table
const pId = 1;
const participantsArray = [];

const currentOrMostRecentIndustryOptions = [
  'Accommodation and food services',
  'Administrative and support, waste management and remediation services ',
  'Agriculture, forestry, fishing, and hunting',
  'Arts, entertainment, and recreation',
  'Community Social Services',
  'Construction',
  'Continuing Care and Community Health Care',
  'Educational services',
  'Finance and insurance',
  'Health care and social assistance',
  'Information and cultural industries',
  'Management of companies and enterprises',
  'Manufacturing',
  'Mining, quarrying, and oil and gas extraction',
  'Professional, scientific, and technical services',
  'Public administration',
  'Real estate and rental and leasing',
  'Retail trade',
  'Transportation and warehousing',
  'Tourism & Hospitality',
  'Utilities',
  'Wholesale trade',
  'None, not working previously',
  'Other, please specify:',
];

const preferNotOptions = ['Yes', 'No', 'Prefer not to answer'];

/** *
 * Generate X amount of random participants
 */
const generateParticipants = async (amount: number) => {
  for (let i = 0; i < amount; i += 1) {
    const pc = faker.address.zipCode();
    const fn = faker.name.lastName();
    const ln = faker.name.firstName();
    const participant = {
      body: JSON.stringify({
        maximusId: 100000 + i,
        lastName: fn,
        firstName: ln,
        postalCode: pc,
        postalCodeFsa: pc.slice(0, 3),
        phoneNumber: faker.phone.number('##########'),
        emailAddress: faker.internet.email(fn, ln),
        preferredLocation: _.sample(healthRegions),
        interested: 'yes',
        crcClear: 'yes',
        program: _.sample([Program.HCA, Program.MHAW]),
        driverLicense: _.sample(preferNotOptions),
        indigenous: _.sample(preferNotOptions),
        educationalRequirements: _.sample(yesOrNo),
        currentOrMostRecentIndustry: _.sample(currentOrMostRecentIndustryOptions),
        roleInvolvesMentalHealthOrSubstanceUse: _.sample(yesOrNo),
        experienceWithMentalHealthOrSubstanceUse: _.sample(preferNotOptions),
      }),
    };
    participantsArray.push(participant);
  }

  await convertToCsv(pId, participantsArray, 'participants.csv');
};

(async () => {
  console.log('------ Running');
  console.log('------ Generating Participants');
  await generateParticipants(NUM_PARTICIPANTS_TO_GENERATE);
  console.log('---- Finished');
})();
