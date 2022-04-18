import * as yup from 'yup';
import { healthRegions } from '../constants';
import { errorMessage } from '../functions';

export const EditPSISchema = yup.object().shape({
  instituteName: yup.string().required(errorMessage),
  streetAddress: yup.string().required(errorMessage),
  city: yup.string().required(errorMessage),
  postalCode: yup
    .string()
    .required(errorMessage)
    .matches(/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/, 'Format as A1A 1A1'),
  healthAuthority: yup.string().required(errorMessage).oneOf(healthRegions, 'Invalid region'),
});
