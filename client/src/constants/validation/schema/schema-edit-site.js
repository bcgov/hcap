import * as yup from 'yup';
import { siteTypesOptions } from '../constants';
import { errorMessage } from '../functions';

export const EditSiteSchema = yup.object().shape({
  siteContactFirstName: yup.string().required(errorMessage),
  siteContactLastName: yup.string().required(errorMessage),
  siteContactPhone: yup
    .string()
    .required(errorMessage)
    .matches(/^[0-9]{10}$/, 'Phone number must be provided as 10 digits'),
  siteContactEmail: yup.string().required(errorMessage).email('Invalid email address'),
  siteName: yup
    .string()
    .required(errorMessage)
    .max(255, 'Site name should be no longer than 255 characters'),
  registeredBusinessName: yup.string().required(errorMessage),
  address: yup.string().required(errorMessage),
  city: yup.string().required(errorMessage),
  postalCode: yup
    .string()
    .required(errorMessage)
    .matches(/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/, 'Format as A1A 1A1'),
  siteType: yup.string().required(errorMessage).oneOf(siteTypesOptions, 'Invalid site type'),
  operatorName: yup.string().nullable(),
  operatorContactFirstName: yup.string().required(errorMessage),
  operatorContactLastName: yup.string().required(errorMessage),
  operatorPhone: yup
    .string()
    .required(errorMessage)
    .matches(/^[0-9]{10}$/, 'Phone number must be provided as 10 digits'),
  operatorEmail: yup.string().required(errorMessage).email('Invalid email address'),
});
