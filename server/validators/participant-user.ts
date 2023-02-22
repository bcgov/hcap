import * as yup from 'yup';
import { validIndigenousIdentities } from '../constants';

export const UserParticipantEditSchema = yup.object().shape({
  postalCode: yup
    .string()
    .nullable()
    .matches(/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/),
  postalCodeFsa: yup
    .string()
    .nullable()
    .matches(/^[A-Z]\d[A-Z]$/),
  phoneNumber: yup.string().matches(/^[0-9]{10}$/, 'Phone number must be provided as 10 digits'),
  isIndigenous: yup.boolean(),
  indigenousIdentities: yup.array().when('isIndigenous', {
    is: true,
    then: (arraySchema) =>
      arraySchema.of(yup.string().oneOf(validIndigenousIdentities, 'Invalid identity')),
  }),
});

export const WaitlistEmailSchema = yup
  .object()
  .noUnknown('Unknown field in entry')
  .shape({
    email: yup.string().required('Email is required').email('Invalid email address'),
  });
