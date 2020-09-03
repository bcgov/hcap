import * as yup from 'yup';

export const DeterminationSchema = yup.object().shape({
  determination: yup.string().nullable().oneOf(['followup', 'passed', 'failed'], 'Invalid decision').required('Decision is required'),
  notes: yup.string().required('Notes are required'),
});

const errorMessage = ({ path }) => {
  const errorMessages = {
    // Eligibility
    eligibility: 'We\'re sorry, but current eligibility to work in Canada is a requirement to submit this form.',

    // Contact info
    firstName: 'First name is required',
    lastName: 'Last name is required',
    phoneNumber: 'Phone number is required',
    postalCode: 'Postal code is required',

    // Consent
    consent: 'We\'re sorry, but we cannot process your request without permission.',
  };
  return errorMessages[path] || `Failed validation on ${path}`;
};

export const FormSchema = yup.object().noUnknown('Unknown field for form').shape({
  // Eligibility
  eligibility: yup.boolean().typeError(errorMessage).required(errorMessage).test('is-true', errorMessage, (v) => v === true),

  // Contact info
  firstName: yup.string().required(errorMessage),
  lastName: yup.string().required(errorMessage),
  phoneNumber: yup.string().required(errorMessage),
  emailAddress: yup.string().required(errorMessage),
  postalCode: yup.string().required(errorMessage),

  // Consent
  consent: yup.boolean().typeError(errorMessage).required(errorMessage).test('is-true', errorMessage, (v) => v === true),
});
