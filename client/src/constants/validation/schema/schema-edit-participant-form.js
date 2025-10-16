import * as yup from 'yup';
import { errorMessage } from '../functions';

export const EditParticipantFormSchema = yup.object().shape({
  firstName: yup.string().required(errorMessage({ path: 'firstName' })),
  lastName: yup.string().required(errorMessage({ path: 'lastName' })),
  phoneNumber: yup
    .string()
    .required(errorMessage({ path: 'phoneNumber' }))
    .matches(/^\d{10}$/, 'Phone number must be provided as 10 digits'),
  postalCode: yup
    .string()
    .required('Postal code is required')
    .test('isnot-null', 'Postal code is required!', (v) => {
      return v !== undefined && v !== '' && v !== null;
    })
    .matches(/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/, 'Invalid postal code'),
  emailAddress: yup
    .string()
    .required(errorMessage({ path: 'emailAddress' }))
    .matches(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      'Please enter a valid email address with a proper domain (e.g., user@example.com)',
    ),
  educationalRequirements: yup.string().required(errorMessage({ path: 'educationalRequirements' })),
  interested: yup.string().nullable(),
});
