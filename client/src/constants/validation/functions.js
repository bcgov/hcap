import { minDateString, maxDateString } from '../archiveParticipantsConstants';

export const validateDateString = (s) => {
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(s) === false) return false;
  const date = Date.parse(s);
  return typeof date === 'number' && !Number.isNaN(date);
};

export const validatePastDateString = (s) => {
  if (!validateDateString(s)) return false;
  return Date.parse(s) <= new Date();
};
export const validateDateIsInThePast = (s) => {
  return Date.parse(s) <= new Date();
};
export const validateDateIsReasonable = (d) => {
  try {
    return Date.parse(d) >= Date.parse(minDateString) && Date.parse(d) <= Date.parse(maxDateString);
  } catch (e) {
    return false;
  }
};
export const errorDateIsReasonable =
  'Invalid entry. Date must be after December 31st 1899 and before January 1st 2100.';

export const validateUniqueArray = (a) => Array.isArray(a) && new Set(a).size === a.length;

export const validateBlankOrPositiveInteger = (n) => (!!n ? Number.isInteger(n) && n > 0 : true);

export const errorMessage = ({ path }) => {
  const errorMessages = {
    // Common fields
    firstName: 'First name is required',
    lastName: 'Last name is required',
    phoneNumber: 'Phone number is required',
    emailAddress: 'Email address is required',
    postalCode: 'Postal code is required',
    startDate: 'Start Date is required',
    endDate: 'End Date is required',
    username: 'Username is required',

    // Employer operator contact info
    registeredBusinessName: 'Business name is required',
    isRHO: 'Regional Health Office status is required',
    operatorName: 'Operator name is required',
    operatorContactFirstName: 'Operator contact first name is required',
    operatorContactLastName: 'Operator contact last name is required',
    operatorEmail: 'Operator email is required',
    operatorPhone: 'Operator phone is required',
    operatorAddress: 'Operator address is required',
    operatorPostalCode: 'Operator postal code is required',

    // Employer site contact info
    siteName: 'Site name is required',
    instituteName: 'Post Secondary Institute name is required',
    address: 'Address is required',
    streetAddress: 'Address is required',
    healthAuthority: 'Health authority is required',
    siteContactFirstName: 'First name is required',
    siteContactLastName: 'Last name is required',

    // Employer site type and size info
    siteType: 'Site type is required',
    numPublicLongTermCare: 'Number of publicly funded long-term care beds is required',
    numPrivateLongTermCare: 'Number of privately funded long-term care beds is required',
    numPublicAssistedLiving: 'Number of publicly funded assisted living beds is required',
    numPrivateAssistedLiving: 'Number of privately funded assisted living beds is required',

    // Workforce Baseline
    workforceBaseline: 'All Workforce Baseline fields are required',

    // Employer HCAP request
    hcswFteNumber: 'A number is required',

    // Employer certification
    doesCertify: 'Must certify this',

    // Orbeon ID from the XML file name
    orbeonId: 'Invalid Orbeon ID format.',

    // Participant info
    eligibility:
      "We're sorry, but current eligibility to work in Canada is a requirement to submit this form.",
    preferredLocation: "Please select at least one location you'd like to work in.",
    reasonForFindingOut: 'Please let us know how you found out about HCAP',
    consent: "We're sorry, but we cannot process your request without permission.",

    // Cohort
    cohortName: 'Cohort Name is required',
    cohort: 'Cohort is required',
    institute: 'Institute is required',
  };
  return errorMessages[path] || `Failed validation on ${path}`;
};
