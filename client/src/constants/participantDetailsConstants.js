import { onRosSiteUpdate, onRosDateUpdate, onRosStartDateUpdate } from '../services';

export const keyLabelMap = {
  fullName: 'Full Name',
  phoneNumber: 'Phone Number',
  emailAddress: 'Email Address',
  interested: 'Program Interest',
  preferredLocation: 'Preferred Location',
  postalCodeFsa: 'Postal Code FSA',
  cohortName: 'Cohort / PSI',
  postHireStatusLabel: 'Graduation Status',
};

export const rosKeyMap = {
  siteName: {
    label: 'Current Site',
    editable: true,
    onUpdate: onRosSiteUpdate,
  },
  healthAuthority: { label: 'Health Authority (current site)', editable: false },
  date: {
    label: 'RoS Start Date',
    editable: true,
    onUpdate: onRosDateUpdate,
  },
  startDate: {
    label: 'RoS Start Date at a Current Site',
    editable: true,
    onUpdate: onRosStartDateUpdate,
  },
  endDate: { label: 'RoS End Date', editable: false },
};
