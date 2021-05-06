export const pageSize = 10;

export const defaultColumns = [
  { id: 'id', name: 'ID' },
  { id: 'lastName', name: 'Last Name' },
  { id: 'firstName', name: 'First Name' },
  { id: 'postalCodeFsa', name: 'FSA' },
  { id: 'preferredLocation', name: 'Preferred Region(s)' },
  { id: 'nonHCAP', name: 'Non-HCAP' },
  { id: 'userUpdatedAt', name: 'Last Updated' },
  { id: 'callbackStatus', name: 'Callback Status' },
];

export const sortOrder = [
  'id',
  'lastName',
  'firstName',
  'status',
  'statusInfo',
  'postalCodeFsa',
  'phoneNumber',
  'emailAddress',
  'preferredLocation',
  'distance',
  'interested',
  'nonHCAP',
  'crcClear',
  'callbackStatus',
  'userUpdatedAt',
  'engage',
  'edit',
];

export const tabs = { // Tabs, associated allowed roles, displayed statuses
  'Available Participants': {
    roles: ['employer', 'health_authority'],
    statuses: ['open'],
  },
  'My Candidates': {
    roles: ['employer', 'health_authority'],
    statuses: ['prospecting', 'interviewing', 'offer_made', 'unavailable'],
  },
  'Archived Candidates': {
    roles: ['employer', 'health_authority'],
    statuses: ['rejected'],
  },
  'Hired Candidates': {
    roles: ['employer', 'health_authority'],
    statuses: ['hired'],
  },
  Participants: {
    roles: ['ministry_of_health', 'superuser'],
    statuses: ['open', 'prospecting', 'interviewing', 'offer_made', 'rejected', 'hired'],
  },
};
