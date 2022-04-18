import * as yup from 'yup';
import { healthRegions } from '../constants';
import { validateBlankOrPositiveInteger, errorMessage } from '../functions';

export const CreateSiteSchema = yup.object().shape({
  siteId: yup.number().required('Site ID is required'),
  siteName: yup.string().required(errorMessage),
  allocation: yup
    .number()
    .nullable()
    .test('validate-blank-or-number', 'Must be a positive number', validateBlankOrPositiveInteger),
  address: yup.string().nullable(),
  city: yup.string().nullable(),
  isRHO: yup.boolean().nullable().required(errorMessage),
  healthAuthority: yup.string().required(errorMessage).oneOf(healthRegions, 'Invalid region'),
  postalCode: yup
    .string()
    .required(errorMessage)
    .matches(/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/, 'Format as A1A 1A1'),
  registeredBusinessName: yup.string().nullable(),
  operatorName: yup.string().nullable(),
  operatorContactFirstName: yup.string().nullable(),
  operatorContactLastName: yup.string().nullable(),
  operatorEmail: yup.string().nullable().email('Invalid email address'),
  operatorPhone: yup
    .string()
    .nullable()
    .matches(/^([0-9]{10})?$/, 'Phone number must be provided as 10 digits'),
  siteContactFirstName: yup.string().nullable(),
  siteContactLastName: yup.string().nullable(),
  siteContactPhone: yup
    .string()
    .nullable()
    .matches(/^[0-9]{10}$/, 'Phone number must be provided as 10 digits'),
  siteContactEmail: yup.string().nullable().email('Invalid email address'),
});
