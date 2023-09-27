import * as yup from 'yup';
import { healthRegions, foundOutReasons } from '../constants';
import { validateUniqueArray, errorMessage } from '../functions';

export const ParticipantFormSchema = yup
  .object()
  .noUnknown('Unknown field for form')
  .shape({
    // Orbeon Id - only present for parsed XML files
    orbeonId: yup.string().typeError(errorMessage),

    // HCAP program
    program: yup.string().required(errorMessage),

    // Eligibility
    eligibility: yup
      .boolean()
      .typeError(errorMessage)
      .required(errorMessage)
      .test('is-true', errorMessage({ path: 'screenOut' }), (v) => v === true),

    educationalRequirements: yup.string().required(errorMessage),

    // Contact info
    firstName: yup.string().required(errorMessage),
    lastName: yup.string().required(errorMessage),
    phoneNumber: yup
      .string()
      .required(errorMessage)
      .matches(/^\d{10}$/, 'Phone number must be provided as 10 digits'),
    emailAddress: yup.string().required(errorMessage).email('Invalid email address'),
    postalCode: yup
      .string()
      .required(errorMessage)
      .matches(/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/, 'Format as A1A 1A1'),

    indigenous: yup.string(),
    driverLicense: yup.string().required(errorMessage),

    experienceWithMentalHealthOrSubstanceUse: yup.string().when(['program'], {
      is: (program) => program === 'MHAW',
      then: () => yup.string(),
    }),
    // Preferred location
    preferredLocation: yup
      .array()
      .required(errorMessage)
      .of(yup.string().oneOf(healthRegions, 'Invalid location'))
      .test('is-unique-array', 'Preferred locations must be unique', validateUniqueArray),

    // How did the participant find out about HCAP
    reasonForFindingOut: yup
      .array()
      .required(errorMessage)
      .of(yup.string().oneOf(foundOutReasons, 'Invalid selection'))
      .test('is-unique-array', 'Each reason must be unique', validateUniqueArray),

    // background information
    currentOrMostRecentIndustry: yup.string(),
    otherIndustry: yup.string().when(['currentOrMostRecentIndustry'], {
      is: (industry) => industry === 'Other, please specify:',
      then: () => yup.string().required(errorMessage),
    }),

    roleInvolvesMentalHealthOrSubstanceUse: yup
      .string()
      .when(['program', 'currentOrMostRecentIndustry'], {
        is: (program, currentOrMostRecentIndustry) =>
          program === 'MHAW' &&
          (currentOrMostRecentIndustry === 'Health care and social assistance' ||
            currentOrMostRecentIndustry === 'Continuing Care and Community Health Care' ||
            currentOrMostRecentIndustry === 'Community Social Services'),
        then: () => yup.string().oneOf(['Yes', 'No']),
      }),

    // Consent
    consent: yup
      .boolean()
      .typeError(errorMessage)
      .required(errorMessage)
      .test('is-true', errorMessage, (v) => v === true),
  });
