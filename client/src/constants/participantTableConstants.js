import ToastStatus from './toast';
export const pageSize = 10;

export const participantStatus = {
  OPEN: 'open',
  PROSPECTING: 'prospecting',
  interviewing: 'interviewing',
  OFFER_MAKDE: 'offer_made',
  ARCHIVED: 'archived',
  REJECTED: 'rejected',
  HIRED: 'hired',
};

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
    statuses: [
      'open',
      'prospecting',
      'interviewing',
      'offer_made',
      'archived',
      'rejected',
      'hired',
    ],
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
    archived: {
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
  locationFilter: '',
  siteSelector: '',
};

export const tabStatuses = {
  'Available Participants': ['open'],
  'My Candidates': ['prospecting', 'interviewing', 'offer_made', 'unavailable'],
  'Archived Candidates': ['rejected', 'archived'],
  'Hired Candidates': ['hired', 'pending_acknowledgement'],
  Participants: [
    'open',
    'prospecting',
    'interviewing',
    'offer_made',
    'rejected',
    'hired',
    'archived',
  ],
};

export const tabsByRole = {
  superuser: ['Participants'],
  ministry_of_health: ['Participants'],
  health_authority: [
    'Available Participants',
    'My Candidates',
    'Archived Candidates',
    'Hired Candidates',
  ],
  employer: ['Available Participants', 'My Candidates', 'Archived Candidates', 'Hired Candidates'],
};

const columns = {
  id: { id: 'id', name: 'ID', sortOrder: 1 },
  lastName: { id: 'lastName', name: 'Last Name', sortOrder: 2 },
  firstName: { id: 'firstName', name: 'First Name', sortOrder: 3 },
  status: { id: 'status', name: 'Status', sortOrder: 4 },
  statusInfo: { id: 'statusInfo', name: 'Status', sortOrder: 5 },
  postalCodeFsa: { id: 'postalCodeFsa', name: 'FSA', sortOrder: 6 },
  phoneNumber: { id: 'phoneNumber', name: 'Phone Number', sortOrder: 7 },
  emailAddress: { id: 'emailAddress', name: 'Email Address', sortOrder: 8 },
  preferredLocation: { id: 'preferredLocation', name: 'Preferred Region(s)', sortOrder: 9 },
  distance: { id: 'distance', name: 'Site Distance', sortOrder: 10 },
  interested: { id: 'interested', name: 'Interest', sortOrder: 11 },
  nonHCAP: { id: 'nonHCAP', name: 'Non-HCAP', sortOrder: 12 },
  crcClear: { id: 'crcClear', name: 'CRC Clear', sortOrder: 13 },
  callbackStatus: { id: 'callbackStatus', name: 'Callback Status', sortOrder: 14 },
  userUpdatedAt: { id: 'userUpdatedAt', name: 'Last Updated', sortOrder: 15 },
  isIndigenous: { id: 'isIndigenous', name:'Is Indigenous', sortOrder:16},
  engage: { id: 'engage', name: null, sortOrder: 17 },
  edit: { id: 'edit', name: null, sortOrder: 18 },
  siteName: { id: 'siteName', name: 'Site Name', sortOrder: 19 },
  archive: { id: 'archive', name: 'Archive', soryOrder: 20 },
};

const {
  id,
  lastName,
  firstName,
  status,
  postalCodeFsa,
  phoneNumber,
  emailAddress,
  preferredLocation,
  distance,
  interested,
  nonHCAP,
  crcClear,
  callbackStatus,
  userUpdatedAt,
  engage,
  edit,
  siteName,
  archive,
  isIndigenous
} = columns;

export const columnsByRole = {
  superuser: {
    Participants: [
      id,
      lastName,
      firstName,
      status,
      postalCodeFsa,
      phoneNumber,
      emailAddress,
      preferredLocation,
      distance,
      interested,
      nonHCAP,
      crcClear,
      userUpdatedAt,
      edit,
    ],
  },

  ministry_of_health: {
    Participants: [
      id,
      lastName,
      firstName,
      status,
      postalCodeFsa,
      preferredLocation,
      interested,
      nonHCAP,
      crcClear,
      userUpdatedAt,
      edit,
    ],
  },

  health_authority: {
    'Available Participants': [
      id,
      lastName,
      firstName,
      postalCodeFsa,
      phoneNumber,
      emailAddress,
      preferredLocation,
      distance,
      nonHCAP,
      callbackStatus,
      userUpdatedAt,
      isIndigenous,
      engage,
    ],
    'My Candidates': [
      id,
      lastName,
      firstName,
      status,
      postalCodeFsa,
      phoneNumber,
      emailAddress,
      preferredLocation,
      distance,
      nonHCAP,
      userUpdatedAt,
      isIndigenous,
      engage,
    ],
    'Archived Candidates': [
      id,
      lastName,
      firstName,
      status,
      postalCodeFsa,
      phoneNumber,
      emailAddress,
      preferredLocation,
      distance,
      nonHCAP,
      userUpdatedAt,
      isIndigenous,
      engage,
    ],
    'Hired Candidates': [
      id,
      lastName,
      firstName,
      status,
      postalCodeFsa,
      phoneNumber,
      emailAddress,
      preferredLocation,
      distance,
      siteName,
      nonHCAP,
      userUpdatedAt,
      isIndigenous,
      archive,
    ],
  },

  employer: {
    'Available Participants': [
      id,
      lastName,
      firstName,
      postalCodeFsa,
      phoneNumber,
      emailAddress,
      preferredLocation,
      distance,
      nonHCAP,
      callbackStatus,
      userUpdatedAt,
      isIndigenous,
      engage,
    ],
    'My Candidates': [
      id,
      lastName,
      firstName,
      status,
      postalCodeFsa,
      phoneNumber,
      emailAddress,
      preferredLocation,
      distance,
      nonHCAP,
      userUpdatedAt,
      isIndigenous,
      engage,
    ],
    'Archived Candidates': [
      id,
      lastName,
      firstName,
      status,
      postalCodeFsa,
      phoneNumber,
      emailAddress,
      preferredLocation,
      distance,
      nonHCAP,
      userUpdatedAt,
      isIndigenous,
      engage,
    ],
    'Hired Candidates': [
      id,
      lastName,
      firstName,
      status,
      postalCodeFsa,
      phoneNumber,
      emailAddress,
      preferredLocation,
      distance,
      siteName,
      nonHCAP,
      userUpdatedAt,
      isIndigenous,
      archive,
    ],
  },
};
