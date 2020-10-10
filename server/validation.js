/* eslint-disable max-len */
const yup = require('yup');

const healthRegions = [
  'Interior',
  'Fraser',
  'Vancouver Coastal',
  'Vancouver Island',
  'Northern',
];

const validateUniqueArray = (a) => (
  Array.isArray(a) && new Set(a).size === a.length
);

const errorMessage = ({ path }) => {
  const errorMessages = {
    // HCAP Request
    hcswFteNumber: 'Number of HCSW FTEs is required',

    // Operator Information
    operatorFirstName: 'Operator first name is required',
    operatorLastName: 'Operator last name is required',
    operatorContactFirstName: 'Operator contact first name is required',
    operatorContactLastName: 'Operator contact last name is required',
    operatorEmail: 'Operator email is required',
    operatorPhone: 'Operator phone is required',

    // Common fields
    firstName: 'First name is required',
    lastName: 'Last name is required',
    phoneNumber: 'Phone number is required',
    emailAddress: 'Email address is required',
    postalCode: 'Postal code is required',

    // Employer basic info
    registeredBusinessName: 'Business name is required',
    address: 'Address is required',
    location: 'Location is required',

    // Business details
    businessKind: 'Business kind is required',
    workersSize: 'Number of workers is required',
    employerType: 'Employer type is required',

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
  // HCAP Request
  hcswFteNumber: yup.number().required(errorMessage).moreThan(0, 'Number must be greater than 0'),

  // Operator Information
  operatorFirstName: yup.string().required(errorMessage),
  operatorLastName: yup.string().required(errorMessage),
  operatorContactFirstName: yup.string().required(errorMessage),
  operatorContactLastName: yup.string().required(errorMessage),
  operatorEmail: yup.string().required(errorMessage).matches(/^(.+@.+\..+)?$/, 'Invalid email address'),
  operatorPhone: yup.string().required(errorMessage).matches(/^[0-9]{10}$/, 'Phone number must be provided as 10 digits'),

  // Basic info
  registeredBusinessName: yup.string().required(errorMessage),
  address: yup.string().required(errorMessage),
  postalCode: yup.string().required(errorMessage).matches(/^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d$/, 'Format as A1A 1A1'),
  location: yup.string().required(errorMessage).oneOf(healthRegions, 'Invalid location'),
  firstName: yup.string().required(errorMessage),
  lastName: yup.string().required(errorMessage),
  phoneNumber: yup.string().required(errorMessage).matches(/^[0-9]{10}$/, 'Phone number must be provided as 10 digits'),
  emailAddress: yup.string().required(errorMessage).matches(/^(.+@.+\..+)?$/, 'Invalid email address'),

  // Business details
  businessKind: yup.string().required(errorMessage),
  workersSize: yup.number().required(errorMessage).integer('Number of workers must be an integer').moreThan(0, 'Number must be greater than 0'),
  employerType: yup.string().required(errorMessage),
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
