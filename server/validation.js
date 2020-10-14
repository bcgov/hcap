/* eslint-disable max-len */
const yup = require('yup');

const healthRegions = [
  'Interior',
  'Fraser',
  'Vancouver Coastal',
  'Vancouver Island',
  'Northern',
];

const roles = [
  'Registered Nurse',
  'Licensed Practical Nurse',
  'Health Care Assistant',
  'Food Services Worker',
  'Housekeeping',
  'COVID-19 IPC Response',
];

const siteTypes = [
  'Long-term care',
  'Assisted living',
  'Both',
  'Other',
];

const validateUniqueArray = (a) => (
  Array.isArray(a) && new Set(a).size === a.length
);

const errorMessage = ({ path }) => {
  const errorMessages = {
    // Common fields
    firstName: 'First name is required',
    lastName: 'Last name is required',
    phoneNumber: 'Phone number is required',
    emailAddress: 'Email address is required',
    postalCode: 'Postal code is required',

    // Employer operator info
    registeredBusinessName: 'Business name is required',
    operatorFirstName: 'Operator first name is required',
    operatorLastName: 'Operator last name is required',
    operatorContactFirstName: 'Operator contact first name is required',
    operatorContactLastName: 'Operator contact last name is required',
    operatorEmail: 'Operator email is required',
    operatorPhone: 'Operator phone is required',

    // Employer site info
    siteName: 'Site name is required',
    address: 'Address is required',
    geographicRegion: 'Geographic region is required',
    siteType: 'Site type is required',
    numPublicLongTermCare: 'Number of publicly funded long-term care beds is required',
    numPrivateLongTermCare: 'Number of privately funded long-term care beds is required',
    numPublicAssistedLiving: 'Number of publicly funded assisted living beds is required',
    numPrivateAssistedLiving: 'Number of privately funded assisted living beds is required',
    siteContactFirstName: 'First name is required',
    siteContactLastName: 'Last name is required',

    // Employer HCAP request
    hcswFteNumber: 'Number of HCSW FTEs is required',

    // Orbeon ID from the XML file name
    orbeonId: 'Invalid Orbeon ID format.',

    // Employee info
    eligibility: 'We\'re sorry, but current eligibility to work in Canada is a requirement to submit this form.',
    preferredLocation: 'Please select at least one location you\'d like to work in.',
    consent: 'We\'re sorry, but we cannot process your request without permission.',
  };
  return errorMessages[path] || `Failed validation on ${path}`;
};

const LoginSchema = yup.object().noUnknown().shape({
  username: yup.string().required('Username is required'),
  password: yup.string().required('Password is required'),
});

const EmployerFormSchema = yup.object().noUnknown('Unknown field for form').shape({
  // Operator Information
  registeredBusinessName: yup.string().required(errorMessage),
  operatorFirstName: yup.string().required(errorMessage),
  operatorLastName: yup.string().required(errorMessage),
  operatorContactFirstName: yup.string().required(errorMessage),
  operatorContactLastName: yup.string().required(errorMessage),
  operatorEmail: yup.string().required(errorMessage).matches(/^(.+@.+\..+)?$/, 'Invalid email address'),
  operatorPhone: yup.string().required(errorMessage).matches(/^[0-9]{10}$/, 'Phone number must be provided as 10 digits'),

  // Site info
  siteName: yup.string().required(errorMessage),
  address: yup.string().required(errorMessage),
  postalCode: yup.string().required(errorMessage).matches(/^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/, 'Format as A1A 1A1'),
  geographicRegion: yup.string().required(errorMessage).oneOf(healthRegions, 'Invalid location'),
  siteType: yup.string().required(errorMessage).oneOf(siteTypes, 'Invalid site type'),
  otherSite: yup.string().when('siteType', {
    is: 'Other',
    then: yup.string().required('Must specify other site type'),
    otherwise: yup.string().nullable().test('is-null', 'Other site type must be null', (v) => v == null),
  }),

  // Site size info
  numPublicLongTermCare: yup.number().required(errorMessage).integer('Number must be an integer').moreThan(-1, 'Number must be positive'),
  numPrivateLongTermCare: yup.number().required(errorMessage).integer('Number must be an integer').moreThan(-1, 'Number must be positive'),
  numPublicAssistedLiving: yup.number().required(errorMessage).integer('Number must be an integer').moreThan(-1, 'Number must be positive'),
  numPrivateAssistedLiving: yup.number().required(errorMessage).integer('Number must be an integer').moreThan(-1, 'Number must be positive'),
  comment: yup.string().nullable(),

  // Site contact info
  siteContactFirstName: yup.string().required(errorMessage),
  siteContactLastName: yup.string().required(errorMessage),
  phoneNumber: yup.string().required(errorMessage).matches(/^[0-9]{10}$/, 'Phone number must be provided as 10 digits'),
  emailAddress: yup.string().required(errorMessage).matches(/^(.+@.+\..+)?$/, 'Invalid email address'),

  // HCAP Request
  hcswFteNumber: yup.number().required(errorMessage).moreThan(0, 'Number must be greater than 0'),

  // Workforce Baseline
  workforceBaseline: yup.array().of(yup.object().shape({
    role: yup.string().oneOf(roles, 'Invalid role'),
    currentFullTime: yup.number().integer('Number must be an integer').moreThan(-1, 'Number must be positive'),
    currentPartTime: yup.number().integer('Number must be an integer').moreThan(-1, 'Number must be positive'),
    currentCasual: yup.number().integer('Number must be an integer').moreThan(-1, 'Number must be positive'),
    vacancieFullTime: yup.number().integer('Number must be an integer').moreThan(-1, 'Number must be positive'),
    vacanciePartTime: yup.number().integer('Number must be an integer').moreThan(-1, 'Number must be positive'),
    vacancieCasual: yup.number().integer('Number must be an integer').moreThan(-1, 'Number must be positive'),
  })),
});

const EmployeeFormSchema = yup.object().noUnknown('Unknown field for form').shape({
  // Orbeon Id
  orbeonId: yup.string().typeError(errorMessage),

  // Eligibility
  eligibility: yup.boolean().typeError(errorMessage).required(errorMessage).test('is-true', errorMessage, (v) => v === true),

  // Contact info
  firstName: yup.string().required(errorMessage),
  lastName: yup.string().required(errorMessage),
  phoneNumber: yup.string().required(errorMessage).matches(/^\d{10}$/, 'Phone number must be provided as 10 digits'),
  emailAddress: yup.string().required(errorMessage).matches(/^(.+@.+\..+)?$/, 'Invalid email address'),
  postalCode: yup.string().required(errorMessage).matches(/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/, 'Format as A1A 1A1'),

  // Preferred location
  preferredLocation: yup.array().required(errorMessage).of(
    yup.string().oneOf(healthRegions, 'Invalid location'),
  ).test('is-unique-array', 'Preferred locations must be unique', validateUniqueArray),

  // Consent
  consent: yup.boolean().typeError(errorMessage).required(errorMessage).test('is-true', errorMessage, (v) => v === true),
});

const validate = async (schema, data) => schema.validate(data, { strict: true });

module.exports = {
  LoginSchema, EmployerFormSchema, EmployeeFormSchema, validate,
};
