import ToastStatus from './toast';
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

export const tabs = {
  // Tabs, associated allowed roles, displayed statuses
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
    statuses: ['rejected', 'archived'],
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

export const makeToasts = (firstName, lastName) => {
  return {
    open: {
      status: ToastStatus.Info,
      message: `${firstName} ${lastName} is has been disengaged`,
    },
    interviewing: {
      status: ToastStatus.Info,
      message: `${firstName} ${lastName} is now being interviewed`,
    },
    offer_made: {
      status: ToastStatus.Info,
      message: `${firstName} ${lastName} has been made a job offer`,
    },
    hired: {
      status: ToastStatus.Success,
      message: `${firstName} ${lastName} has been hired`,
    },
    rejected: {
      status: ToastStatus.Info,
      message: `${firstName} ${lastName} has been archived`,
    },
    already_hired: {
      status: ToastStatus.Info,
      message: `${firstName} ${lastName} is already hired by someone else`,
    },
  };
};

export const defaultTableState = {
  fsaText: '',
  emailText: '',
  lastNameText: '',
  fsaFilter: '',
  emailFilter: '',
  lastNameFilter: '',
  pagination: { currentPage: 0 },
  order: { field: 'id', direction: 'asc' },
  tabValue: '',
  locationFilter: '',
  siteSelector: '',
};
