import ToastStatus from './toast';
import { Role } from './user-roles';
import { Program } from './programs';
export const pageSizeOptions = [10, 30, 50, 100];

export const participantStatus = {
  OPEN: 'open',
  PROSPECTING: 'prospecting',
  interviewing: 'interviewing',
  OFFER_MAKDE: 'offer_made',
  ARCHIVED: 'archived',
  REJECTED: 'rejected',
  HIRED: 'hired',
  ROS: 'ros',
};

export const participantEngageStatus = {
  SINGLE_SELECT_SITE: 'single-select-site',
  MULTI_SELECT_SITE: 'multi-select-site',
  PROSPECTING_CONFIRM: 'prospecting',
};

export const tabs = {
  // Tabs, associated allowed roles, displayed statuses
  'Available Participants': {
    roles: [Role.Employer, Role.MHSUEmployer, Role.HealthAuthority],
    statuses: ['open'],
  },
  'My Candidates': {
    roles: [Role.Employer, Role.MHSUEmployer, Role.HealthAuthority],
    statuses: ['prospecting', 'interviewing', 'offer_made', 'unavailable'],
  },
  'Archived Candidates': {
    roles: [Role.Employer, Role.MHSUEmployer, Role.HealthAuthority],
    statuses: ['rejected', 'archived'],
  },
  'Hired Candidates': {
    roles: [Role.Employer, Role.MHSUEmployer, Role.HealthAuthority],
    statuses: ['hired', 'pending_acknowledgement'],
  },
  'Return Of Service': {
    roles: [Role.Employer, Role.MHSUEmployer, Role.HealthAuthority],
    statuses: ['ros', 'hired'],
  },
  Participants: {
    roles: [Role.MinistryOfHealth, Role.Superuser],
    statuses: [
      'open',
      'prospecting',
      'interviewing',
      'offer_made',
      'archived',
      'rejected',
      'hired',
      'ros',
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
    invalid_status_transition: {
      status: ToastStatus.Error,
      message: `Unable to update status for ${firstName} ${lastName}`,
    },
    invalid_archive: {
      status: ToastStatus.Error,
      message: `Unable to archive ${firstName} ${lastName}`,
    },
  };
};

export const FILTERABLE_FIELDS = {
  ID: 'idFilter',
  FSA: 'fsaFilter',
  EMAIL: 'emailFilter',
  LASTNAME: 'lastNameFilter',
  REGION: 'regionFilter',
  IS_INDIGENOUS: 'isIndigenousFilter',
  PROGRAM: 'programFilter',
  LIVED_LIVING_EXPERIENCE: 'livedLivingExperienceFilter',
  WITHDRAWN_PARTICIPANTS: 'withdrawnParticipantsFilter',
};

export const allPrograms = [Program.HCA, Program.MHAW];
export const programsHCA = [Program.HCA];
export const programsMHAW = [Program.MHAW];

export const tabStatuses = {
  'Available Participants': ['open'],
  'My Candidates': ['prospecting', 'interviewing', 'offer_made', 'unavailable'],
  'Archived Candidates': ['rejected', 'archived'],
  'Hired Candidates': ['hired', 'pending_acknowledgement'],
  'Return Of Service': ['ros', 'hired'],
  Participants: [
    'open',
    'prospecting',
    'interviewing',
    'offer_made',
    'rejected',
    'hired',
    'archived',
    'ros',
  ],
};

const EmployerTabs = [
  'Available Participants',
  'My Candidates',
  'Archived Candidates',
  'Hired Candidates',
  'Return Of Service',
];
export const tabsByRole = {
  [Role.Superuser]: ['Participants'],
  [Role.MinistryOfHealth]: ['Participants'],
  [Role.HealthAuthority]: EmployerTabs,
  [Role.Employer]: EmployerTabs,
  [Role.MHSUEmployer]: EmployerTabs,
};

const columns = {
  id: { id: 'id', name: 'ID', sortOrder: 1 },
  lastName: { id: 'lastName', name: 'Last Name', sortOrder: 2 },
  firstName: { id: 'firstName', name: 'First Name', sortOrder: 3 },
  status: { id: 'status', name: 'Status', sortOrder: 4 },
  mohStatus: { id: 'mohStatus', name: 'Status', sortOrder: 5, sortable: false },
  statusInfo: { id: 'statusInfo', name: 'Status', sortOrder: 6 },
  postalCodeFsa: { id: 'postalCodeFsa', name: 'FSA', sortOrder: 7 },
  phoneNumber: { id: 'phoneNumber', name: 'Phone Number', sortOrder: 8 },
  emailAddress: { id: 'emailAddress', name: 'Email Address', sortOrder: 9 },
  preferredLocation: { id: 'preferredLocation', name: 'Preferred Region(s)', sortOrder: 10 },
  driverLicense: { id: 'driverLicense', name: `Driver's License`, sortOrder: 10.1 },
  distance: { id: 'distance', name: 'Site Distance', sortOrder: 11 },
  educationalRequirements: {
    id: 'educationalRequirements',
    name: 'Language Requirements',
    sortOrder: 11.1,
  },
  indigenous: { id: 'indigenous', name: 'Indigenous', sortOrder: 11.2 },
  experienceWithMentalHealthOrSubstanceUse: {
    id: 'experienceWithMentalHealthOrSubstanceUse',
    name: 'Lived/Living MHSU experience',
    sortOrder: 11.3,
  },
  roleInvolvesMentalHealthOrSubstanceUse: {
    id: 'roleInvolvesMentalHealthOrSubstanceUse',
    name: 'Peer Roles',
    sortOrder: 11.4,
  },
  interested: { id: 'interested', name: 'Interest', sortOrder: 12 },
  program: { id: 'program', name: 'Program', sortOrder: 13 },
  callbackStatus: { id: 'callbackStatus', name: 'Callback Status', sortOrder: 14 },
  userUpdatedAt: { id: 'userUpdatedAt', name: 'Last Updated', sortOrder: 15 },
  engage: { id: 'engage', name: null, sortOrder: 50 },
  siteName: { id: 'siteName', name: 'Site Name', sortOrder: 18 },
  archive: { id: 'archive', name: null, sortOrder: 52 },
  postHireStatuses: { id: 'postHireStatuses', name: 'Graduated', sortOrder: 20, sortable: false },
  edit: { id: 'edit', name: null, sortOrder: 51 },
  rosStartDate: { id: 'rosStartDate', name: 'Return of Service Start Date', sortOrder: 22 },
  rosSiteName: { id: 'rosSiteName', name: 'RoS Site Name', sortOrder: 23 },
  employerName: { id: 'employerName', name: 'Hired By', sortOrder: 24 },
  lastEngagedBy: { id: 'lastEngagedBy', name: 'Last Engaged By', sortOrder: 16 },
  lastEngagedDate: { id: 'lastEngagedDate', name: 'Last Engaged Date', sortOrder: 17 },
  archiveReason: { id: 'archiveReason', name: 'Archive Reason', sortOrder: 25, sortable: false },
};

const {
  id,
  lastName,
  firstName,
  status,
  mohStatus,
  postalCodeFsa,
  phoneNumber,
  emailAddress,
  preferredLocation,
  driverLicense,
  distance,
  educationalRequirements,
  indigenous,
  experienceWithMentalHealthOrSubstanceUse,
  roleInvolvesMentalHealthOrSubstanceUse,
  interested,
  program,
  userUpdatedAt,
  engage,
  edit,
  siteName,
  archive,
  postHireStatuses,
  rosStartDate,
  rosSiteName,
  employerName,
  lastEngagedBy,
  lastEngagedDate,
  archiveReason,
} = columns;

const EmployerColumns = {
  'Available Participants': [
    id,
    lastName,
    firstName,
    postalCodeFsa,
    phoneNumber,
    emailAddress,
    preferredLocation,
    driverLicense,
    distance,
    educationalRequirements,
    indigenous,
    experienceWithMentalHealthOrSubstanceUse,
    roleInvolvesMentalHealthOrSubstanceUse,
    userUpdatedAt,
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
    driverLicense,
    distance,
    educationalRequirements,
    indigenous,
    experienceWithMentalHealthOrSubstanceUse,
    roleInvolvesMentalHealthOrSubstanceUse,
    userUpdatedAt,
    engage,
    siteName,
    lastEngagedBy,
    lastEngagedDate,
  ],
  'Archived Candidates': [
    id,
    lastName,
    firstName,
    status,
    postalCodeFsa,
    preferredLocation,
    driverLicense,
    distance,
    educationalRequirements,
    indigenous,
    experienceWithMentalHealthOrSubstanceUse,
    roleInvolvesMentalHealthOrSubstanceUse,
    program,
    userUpdatedAt,
    siteName,
    archiveReason,
    engage,
  ],
  'Hired Candidates': [
    id,
    lastName,
    firstName,
    status,
    phoneNumber,
    emailAddress,
    siteName,
    program,
    userUpdatedAt,
    postHireStatuses,
    employerName,
    archive,
  ],
  'Return Of Service': [
    id,
    lastName,
    firstName,
    phoneNumber,
    emailAddress,
    status,
    rosStartDate,
    rosSiteName,
    employerName,
    archive,
  ],
};

export const columnsByRole = {
  [Role.Superuser]: {
    Participants: [
      id,
      lastName,
      firstName,
      mohStatus,
      phoneNumber,
      emailAddress,
      preferredLocation,
      driverLicense,
      distance,
      educationalRequirements,
      indigenous,
      experienceWithMentalHealthOrSubstanceUse,
      roleInvolvesMentalHealthOrSubstanceUse,
      interested,
      userUpdatedAt,
      postHireStatuses,
      rosStartDate,
      edit,
    ],
  },
  [Role.MinistryOfHealth]: {
    Participants: [
      id,
      lastName,
      firstName,
      mohStatus,
      preferredLocation,
      driverLicense,
      educationalRequirements,
      indigenous,
      experienceWithMentalHealthOrSubstanceUse,
      roleInvolvesMentalHealthOrSubstanceUse,
      interested,
      userUpdatedAt,
      postHireStatuses,
      rosStartDate,
      edit,
    ],
  },

  [Role.HealthAuthority]: EmployerColumns,
  [Role.Employer]: EmployerColumns,
  [Role.MHSUEmployer]: EmployerColumns,
};
