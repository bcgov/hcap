export const participantFields = [
  'id',
  'program',
  'educationalRequirements',
  'firstName',
  'lastName',
  'postalCodeFsa',
  'indigenous',
  'driverLicense',
  'experienceWithMentalHealthOrSubstanceUse',
  'preferredLocation',
  'currentOrMostRecentIndustry',
  'roleInvolvesMentalHealthOrSubstanceUse',
  'nonHCAP',
  'userUpdatedAt',
  'distance',
  'postHireStatuses',
  'rosStatuses',
];

export const participantFieldsForSuper = [
  ...participantFields,
  'callbackStatus',
  'interested',
  'crcClear',
  'statusInfo',
  'progressStats',
];

export const participantFieldsForMoH = [
  ...participantFields,
  'callbackStatus',
  'interested',
  'crcClear',
  'statusInfo',
  'statusInfos',
  'progressStats',
  'emailAddress',
  'phoneNumber',
];

export const participantFieldsForEmployer = [
  ...participantFields,
  'statusInfos',
  'emailAddress',
  'phoneNumber',
];
