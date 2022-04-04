import * as yup from 'yup';
import { errorMessage } from '../functions';

export const EditParticipantFormSchema = yup.object().shape({
  firstName: yup.string().required(errorMessage),
  lastName: yup.string().required(errorMessage),
  phoneNumber: yup
    .string()
    .required(errorMessage)
    .matches(/^\d{10}$/, 'Phone number must be provided as 10 digits'),
  postalCode: yup
    .string()
    .required('Postal code is required')
    .test('isnot-null', 'Postal code is required!', (v) => {
      return v !== undefined && v !== '' && v !== null;
    })
    .matches(/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/, 'Invalid postal code'),
  emailAddress: yup.string().required(errorMessage).email('Invalid email address'),
  interested: yup.string().nullable(),
});
