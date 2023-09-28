export const validateDateString = (s) => {
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(s) === false) return false;
  const date = Date.parse(s);
  return typeof date === 'number' && !Number.isNaN(date);
};

// NOTE: doesn't actually restrict validation to ISO!
// This should probably be renamed or made more strict.
export const validISODateString = (s) => {
  const date = Date.parse(s);
  return typeof date === 'number' && !Number.isNaN(date);
};

export const validateOptionalDateString = (s) => {
  if (!s) return true;
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(s) === false) return false;
  const date = Date.parse(s);
  return typeof date === 'number' && !Number.isNaN(date);
};

export const validatePastDateString = (s) => {
  if (!validateDateString(s)) return false;
  return Date.parse(s) <= new Date().valueOf();
};

export const isBooleanValue = (val) =>
  typeof val === 'string' && ['yes', 'no'].includes(val.toLowerCase());

export const evaluateBooleanAnswer = (val) => isBooleanValue(val) && val.toLowerCase() === 'yes';

export const validateBlankOrPositiveInteger = (n) =>
  n === '' || typeof n === 'undefined' || n === null || (Number.isInteger(n) && n >= 0);

export const validateOptionalBooleanMixed = (n) =>
  n === 'NULL' ||
  n === null ||
  typeof n === 'undefined' ||
  (Number.isInteger(n) && n >= 0) ||
  (n && isBooleanValue(n));

export const validatePreferredLocation = (n) =>
  typeof n === 'object' &&
  (n.fraser || n.interior || n.vancouverCoastal || n.vancouverIsland || n.northern);

export const validateUniqueArray = (a) => Array.isArray(a) && new Set(a).size === a.length;

export const errorMessage = ({ path }) => {
  const errorMessages = {
    // HCAP Program info
    program: 'Must select one program',
    // Common fields
    firstName: 'First name is required',
    lastName: 'Last name is required',
    phoneNumber: 'Phone number is required',
    emailAddress: 'Email address is required',
    postalCode: 'Postal code is required',

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
      "We're sorry, but current eligibility to work in Canada is a requirement to submit this form",
    educationalRequirements: 'This question is a requirement to submit this form',
    preferredLocation: "Please select at least one location you'd like to work in",
    driverLicense: 'This question is a requirement to submit this form',
    consent: "We're sorry, but we cannot process your request without permission",
    reasonForFindingOut: 'Please let us know how you found out about HCAP',

    // PSI specific value
    instituteName: 'Institute name is required',
    cohortName: 'Cohort name is required',
    city: 'City is required',
    screenOut: 'You do not meet the eligibility criteria to apply for HCAP at this time',
  };
  return errorMessages[path] || `Failed validation on ${path}`;
};

export const errorMessageIndex = (index, indexName) => (error) =>
  `${errorMessage(error)} (${indexName || 'index'} ${index})`;
