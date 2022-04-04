import * as yup from 'yup';
import { errorMessage } from '../functions';

export const ParticipantEditFormSchema = yup.object().shape({
  phoneNumber: yup
    .string()
    .required(errorMessage)
    .matches(/^\d{10}$/, 'Phone number must be provided as 10 digits'),
  postalCode: yup
    .string()
    .required(errorMessage)
    .matches(/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/, 'Format as A1A 1A1'),
});
