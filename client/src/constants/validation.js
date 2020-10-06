import * as yup from 'yup';

const healthRegions = [
  'Interior',
  'Fraser',
  'Vancouver Coastal',
  'Vancouver Island',
  'Northern',
];

const errorMessage = ({ path }) => {
  const errorMessages = {
    // Basic info
    registeredBusinessName: 'Business name is required',
    address: 'Address is required',
    postalCode: 'Postal code is required',
    location: 'Location is required',
    firstName: 'First name is required',
    lastName: 'Last name is required',
    phoneNumber: 'Phone number is required',
    emailAddress: 'Email address is required',

    // Business details
    businessKind: 'Business kind is required',
    workersSize: 'Number of workers is required',
    employerType: 'Employer type is required',
  };
  return errorMessages[path] || `Failed validation on ${path}`;
};

export const LoginSchema = yup.object().noUnknown().shape({
  username: yup.string().required('Username is required'),
  password: yup.string().required('Password is required'),
});

export const EmployerFormSchema = yup.object().noUnknown('Unknown field for form').shape({
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
  workersSize: yup.number().required(errorMessage).integer('Number of workers must be an integer'),
  employerType: yup.string().required(errorMessage),
});

export const EmployeeFormSchema = yup.object().noUnknown('Unknown field for form').shape({});
