import * as yup from 'yup';
import { healthRegions } from '../constants';
import { errorMessage } from '../functions';

export const genericConfirm = yup.object().shape({
  confirmed: yup.boolean().test('is-true', 'Please confirm', (v) => v === true),
});

export const CreatePSISchema = yup.object().shape({
  instituteName: yup.string().required(errorMessage),
  streetAddress: yup.string(),
  city: yup.string(),
  postalCode: yup
    .string()
    .required(errorMessage)
    .matches(/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/, 'Format as A1A 1A1'),
  healthAuthority: yup.string().required(errorMessage).oneOf(healthRegions, 'Invalid region'),
});
