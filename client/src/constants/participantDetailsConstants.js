export const keyLabelMap = {
  fullName: 'Full Name',
  phoneNumber: 'Phone Number',
  emailAddress: 'Email Address',
  interested: 'Program Interest',
  preferredLocation: 'Preferred Location',
  postalCodeFsa: 'Postal Code FSA',
  cohortName: 'Cohort / PSI',
  postHireStatusLabel: 'Graduation Status',
  status: 'Employment Status',
  siteName: 'Site',
  program: 'Program',
  educationalRequirements: 'Educational Requirements',
  experienceWithMentalHealthOrSubstanceUse: 'Lived/Living Experienced With MHSU',
  currentOrMostRecentIndustry: 'Current or Most Recent Industry',
  roleInvolvesMentalHealthOrSubstanceUse: 'Involved In Delivering MHSU Service',
  indigenous: 'Indigenous',
  driverLicense: `Driver's License`,
  reasonForFindingOut: 'How did they learn about HCAP?',
};

export const rosEditWarning =
  'You are making changes to this record, please ensure that all data inputted is accurate';

export const rosKeyMap = {
  siteName: {
    label: 'Current Site',
    editable: true,
  },
  healthAuthority: { label: 'Health Authority (current site)', editable: false },
  date: {
    label: 'RoS Start Date',
    editable: true,
  },
  startDate: {
    label: 'RoS Start Date at a Current Site',
    editable: true,
  },
  endDate: { label: 'RoS End Date', editable: false },
};
