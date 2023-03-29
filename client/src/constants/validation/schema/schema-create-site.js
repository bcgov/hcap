import * as yup from 'yup';
import { healthRegions, siteTypesOptions } from '../constants';
import { errorMessage } from '../functions';

export const CreateSiteSchema = yup.object().shape({
  siteId: yup.number().required('Site ID is required'),
  siteName: yup
    .string()
    .required(errorMessage)
    .max(255, 'Site name should be no longer than 255 characters'),
  address: yup.string().required(errorMessage),
  city: yup.string().required(errorMessage),
  isRHO: yup.boolean().nullable().required(errorMessage),
  healthAuthority: yup.string().required(errorMessage).oneOf(healthRegions, 'Invalid region'),
  siteType: yup.string().required(errorMessage).oneOf(siteTypesOptions, 'Invalid site type'),
  postalCode: yup
    .string()
    .required(errorMessage)
    .matches(/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/, 'Format as A1A 1A1'),
  registeredBusinessName: yup.string().required(errorMessage),
  operatorName: yup.string().required(errorMessage),
  operatorContactFirstName: yup.string().required(errorMessage),
  operatorContactLastName: yup.string().required(errorMessage),
  operatorEmail: yup.string().required(errorMessage).email('Invalid email address'),
  operatorPhone: yup
    .string()
    .required(errorMessage)
    .matches(/^([0-9]{10})?$/, 'Phone number must be provided as 10 digits'),
  siteContactFirstName: yup.string().required(errorMessage),
  siteContactLastName: yup.string().required(errorMessage),
  siteContactPhone: yup
    .string()
    .required(errorMessage)
    .matches(/^[0-9]{10}$/, 'Phone number must be provided as 10 digits'),
  siteContactEmail: yup.string().required(errorMessage).email('Invalid email address'),
});
