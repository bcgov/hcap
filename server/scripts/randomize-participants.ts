import { faker } from '@faker-js/faker';
import _ from 'lodash';
import { convertToCsv } from './services/participant-seed';
import { healthRegions, Program, yesOrNo } from '../constants';
import { industryOptions } from '../constants/industry-options';
import { sampleWeighted } from '../tests/util/sample-weighted';

// this is for canadian postal codes
faker.locale = 'en_CA';

const NUM_PARTICIPANTS_TO_GENERATE = 500;

// increment id for table
const pId = 1;
const participantsArray = [];

const preferNotOptions = ['Yes', 'No', 'Prefer not to answer'];

/** *
 * Generate X amount of random participants
 */
const generateParticipants = async (amount: number) => {
  for (let i = 1; i < amount; i += 1) {
    const pc = faker.address.zipCode();
    const fn = faker.name.lastName();
    const ln = faker.name.firstName();
    let region = sampleWeighted(healthRegions, [2, 8, 1, 3, 1]);
    let program = ['Interior', 'Vancouver Island'].includes(region) ? Program.MHAW : Program.HCA;
    if (i === 480) {
      // participantDetails.spec
      region = 'Interior';
      program = Program.MHAW;
    } else if ([9, 34, 119, 312].includes(i)) {
      // 9 -> participantStatus.spec
      // 34 -> returnOfService.spec
      // 119, 312 -> participantDetails.spec
      region = 'Fraser';
      program = Program.HCA;
    }
    const participant = {
      body: JSON.stringify({
        maximusId: 100000 + i,
        lastName: fn,
        firstName: ln,
        postalCode: pc,
        postalCodeFsa: pc.slice(0, 3),
        phoneNumber: faker.phone.number('##########'),
        emailAddress: faker.internet.email(fn, ln),
        preferredLocation: region,
        interested: 'yes',
        crcClear: 'yes',
        program,
        driverLicense: _.sample(preferNotOptions),
        indigenous: _.sample(preferNotOptions),
        educationalRequirements: sampleWeighted(yesOrNo, [4, 1]),
        currentOrMostRecentIndustry: _.sample(industryOptions),
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
