import dayjs from 'dayjs';
import { faker } from '@faker-js/faker';
import _ from 'lodash';
import { getParticipants } from '../../services/participants';
import { ParticipantStatus } from '../../constants';

let maximusId = 5555555;

const getMaximusId = (): number => {
  maximusId += 1;
  return maximusId;
};

export const fakeParticipant = (options?: object) => ({
  callbackStatus: 'false',
  maximusId: getMaximusId(),
  lastName: faker.name.lastName(),
  firstName: faker.name.firstName(),
  phoneNumber: faker.phone.number('##########'),
  emailAddress: faker.internet.email(),
  interested: 'yes',
  nonHCAP: 'yes',
  crcClear: 'yes',
  contactedDate: dayjs(faker.date.between('2022/01/01', '2022/12/31')).format('MM/DD/YYYY'),
  program: 'HCA',
  preferredLocation: ['Interior', 'Fraser', 'Vancouver Coastal', 'Vancouver Island', 'Northern'][
    _.random(0, 4)
  ],
  ...options,
});

export const getParticipantsByStatus = (user, ...statuses: ParticipantStatus[]) =>
  getParticipants(user, null, null, null, null, null, null, null, null, statuses);
