export const siteTypeOptions = [
  { value: 'Health Authority', label: 'Health Authority' },
  { value: 'Home Health', label: 'Home Health' },
  { value: 'Acute', label: 'Acute' },
  { value: 'Indigenous', label: 'Indigenous' },
  { value: 'Private', label: 'Private' },
  { value: 'Affiliate', label: 'Affiliate' },
];

export const tabColumns = {
  // Tabs, associated allowed roles, displayed statuses
  'Site Details': {
    columns: [],
  },
  'Hired Participants': {
    columns: [
      { id: 'participantId', name: 'ID' },
      { id: 'participantName', name: 'Name' },
      { id: 'hiredDate', name: 'Hire Date' },
      { id: 'startDate', name: 'Start Date' },
      { id: 'program', name: 'Program' },
      { id: 'archive', name: 'Archive' },
    ],
  },
  'Withdrawn Participants': {
    columns: [
      { id: 'participantId', name: 'ID' },
      { id: 'participantName', name: 'Name' },
      { id: 'withdrawnDate', name: 'Withdrawn Date' },
      { id: 'reason', name: 'Reason' },
    ],
  },
  Allocation: {
    columns: [
      { id: 'phaseName', name: 'Phase name' },
      { id: 'startDate', name: 'Start date' },
      { id: 'endDate', name: 'End date' },
      { id: 'allocation', name: 'HCA Allocation' },
      { id: 'mhawAllocation', name: 'MHAW Allocation' },
      { id: 'remainingHcaHires', name: 'Remaining HCA Hires' },
      { id: 'remainingMhawHires', name: 'Remaining MHAW Hires' },
      { id: 'hcaHires', name: 'HCA Hires' },
      { id: 'mhawHires', name: 'MHAW Hires' },
      { id: 'nonHcapHires', name: 'Non-HCAP Hires' },
      { id: 'allocationId', isHidden: true },
      { id: 'details' },
    ],
  },
};

export const fieldsLabelMap = {
  'Site Contact': {
    'First Name': 'siteContactFirstName',
    'Last Name': 'siteContactLastName',
    'Phone Number': 'siteContactPhone',
    'Email Address': 'siteContactEmail',
  },
  'Operator Contact': {
    'Operator Name': 'operatorName',
    'First Name': 'operatorContactFirstName',
    'Last Name': 'operatorContactLastName',
    'Phone Number': 'operatorPhone',
    'Email Address': 'operatorEmail',
  },
  'Site Info': {
    'Site Name': 'siteName',
    'Business Name': 'registeredBusinessName',
    'Street Address': 'address',
    City: 'city',
    'Postal Code': 'postalCode',
    Region: 'healthAuthority',
    'Site Type': 'siteType',
    Program: 'program',
  },
  'Positions Overview (Current Phase)': {
    'HCA Allocation': 'hcaAllocation',
    'MHAW Allocation': 'mhawAllocation',
    'HCA Hires': 'hcaHires',
    'MHAW Hires': 'mhawHires',
    'Non-HCAP Hires': 'nonHcapHires',
  },
};
