import { faker } from '@faker-js/faker';
import { convertToCsv } from './services/participant-seed';
import { Program } from '../constants';

// this is for canadian postal codes
faker.locale = 'en_CA';

const DEFAULT_PREF_LOCATION = 'Fraser';
const NUM_PARTICIPANTS_TO_GENERATE = 500;

// increment id for table
const pId = 1;
const participantsArray = [];

/** *
 * Generate X amount of random participants
 */
const generateParticipants = async (amount: number) => {
  for (let i = 0; i < amount; i++) {
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
        preferredLocation: DEFAULT_PREF_LOCATION,
        interested: 'yes',
        crcClear: 'yes',
        program: Math.floor(Math.random() * 2) === 0 && Program.MHAW, // NOSONAR
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
