import dayjs from 'dayjs';
import { faker } from '@faker-js/faker/locale/en_CA';
import _ from 'lodash';
import { getParticipants } from '../../services/participants';
import { healthRegions, ParticipantStatus, yesOrNo } from '../../constants';
import { industryOptions } from '../../constants/industry-options';

let maximusId = 5555555;

const getMaximusId = (): number => {
  maximusId += 1;
  return maximusId;
};

export const fakeParticipant = (options?: object) => ({
  callbackStatus: 'false',
  maximusId: getMaximusId(),
  lastName: faker.person.lastName(),
  firstName: faker.person.firstName(),
  phoneNumber: faker.phone.number({ style: 'human' }),
  emailAddress: faker.internet.email(),
  interested: 'yes',
  nonHCAP: 'yes',
  crcClear: 'yes',
  contactedDate: dayjs(faker.date.between({ from: '2022/01/01', to: '2022/12/31' })).format(
    'MM/DD/YYYY',
  ),
  postalCode: 'A1A 1A1',
  postalCodeFsa: 'A1A',
  userUpdatedAt: '',
  distance: '',
  program: 'HCA',
  driverLicense: _.sample(yesOrNo),
  indigenous: _.sample(yesOrNo),
  educationalRequirements: _.sample(yesOrNo),
  currentOrMostRecentIndustry: _.sample(industryOptions),
  roleInvolvesMentalHealthOrSubstanceUse: _.sample(yesOrNo),
  experienceWithMentalHealthOrSubstanceUse: _.sample(yesOrNo),
  interestedWorkingPeerSupportRole: _.sample(yesOrNo),
  preferredLocation: _.sample(healthRegions),
  ...options,
});

export const getParticipantsByStatus = (user: any, ...statuses: ParticipantStatus[]) =>
  getParticipants(
    user,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    statuses,
  );
