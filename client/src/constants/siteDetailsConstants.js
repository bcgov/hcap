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
      { id: 'nonHCAP', name: 'Position' },
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
  },
  'Positions Overview': {
    Allocation: 'allocation',
    'HCAP Hires': 'hcapHires',
    'Non-HCAP Hires': 'nonHcapHires',
  },
};
