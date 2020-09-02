import * as yup from 'yup';

const provinces = [
  'Alberta',
  'British Columbia',
  'Manitoba',
  'New Brunswick',
  'Newfoundland and Labrador',
  'Nova Scotia',
  'Ontario',
  'Prince Edward Island',
  'Québec',
  'Saskatchewan',
  'Nunavut',
  'Northwest Territories',
  'Yukon',
];

export const LoginSchema = yup.object().shape({
  username: yup.string().required('Username is required'),
  password: yup.string().required('Password is required'),
});

export const DeterminationSchema = yup.object().shape({
  determination: yup.string().nullable().oneOf(['followup', 'passed', 'failed'], 'Invalid decision').required('Decision is required'),
  notes: yup.string().required('Notes are required'),
});

const errorMessage = ({ path }) => {
  const errorMessages = {
    // Section one
    hasDownloadedBCMinistryAgricultureCovid19Requirements: 'Must download and read the BC Ministry of Agriculture’s COVID-19 requirements',
    hasCompletedCovid19WorkplaceRiskAssessment: 'Must complete COVID-19 risk assessment',
    hasCreatedCovid19InfectionPreventionAndControlProtocol: 'Must create a COVID-19 Infection Prevention and Control Protocol',

    // Section two
    registeredBusinessName: 'Business name is required',
    firstName: 'First name is required',
    lastName: 'Last name is required',
    phoneNumber: 'Phone number is required',
    emailAddress: 'Email address is required',
    addressLine1: 'Address line 1 is required',
    city: 'City is required',
    province: 'Province is required',
    postalCode: 'Postal code is required',
    isSameAsBusinessAddress: 'Must specify whether facility address matches business',

    // Section three
    hasSignage: 'Must specify if you have signage',
    hasSomeoneIdentified: 'Must specify worker contact',
    hasContactedLocalMedicalHealthOfficer: 'Must specify whether Health Officer has been contacted',
    doCommonAreasAllowPhysicalDistancing: 'Must specify whether common areas allow distancing',
    areBedsInRightConfiguration: 'Must specify whether beds are in the correct configuration',
    doesUnderstandNeedsForSelfIsolation: 'Must specify whether need for self isolation is understood',
    hasSeparateAccommodationForWorker: 'Must specify whether sparate accommodations are available',
    hasLaundryServices: 'Must specify whether laundry services are available',
    hasDisposableGloves: 'Must specify whether gloves are available',
    hasWasteRemovalSchedule: 'Must specify whether facility has a waste removal schedule',
    hasSturdyLeakResistantGarbageBags: 'Must specify whether adequate garbage bags are available',
    hasHandWashingSinks: 'Must specify whether sinks are available',
    hasAppropriateSupplyOfSinkWater: 'Must specify whether warm water is available',
    hasPlainSoap: 'Must specify whether soap is available',
    hasPaperTowels: 'Must specify whether paper towels are available',
    hasHandWashingSigns: 'Must specify whether hand washing signs are posted',
    hasSleepingArrangements: 'Must specify whether adequate sleeping arrangements are available',
    hasPhysicalBarriers: 'Must specify whether physical barriers are available',
    hasScheduleToEnsureTouchAreasAreCleaned: 'Must specify whether facility has cleaning schedule',

    // Section four
    hasMaterialsOnRiskOfExposure: 'Must specify whether exposure materials are available',
    hasMaterialsOnHandWashingPhysicalDistancingCoughSneeze: 'Must specify whether personal sanitation materials are available',
    hasMaterialsOnHandWashingFacilities: 'Must specify whether sanitation locations can be provided',
    hasMaterialsReadyOnHowToSeekFirstAid: 'Must specify whether first aid materials are available',
    hasMaterialsReadyOnHowToReportExposure: 'Must specify whether materials on reporting exposure are available',
    hasSchedulesForKitchenEatingAreas: 'Must specify whether facility has eating schedule',
    doWorkersHaveOwnDishware: 'Must specify whether workers have their own dishware',
    isDishwareWashedImmediately: 'Must specify whether dishware is washed immediately',

    // Section five
    hasFacilitiesToSeparateAndSelfIsolate: 'Must specify whether individual separation is possible',
    isPreparedToProvideIndividualsExhibitingSymptoms: 'Must specify whether PPE can be provided',
    isPreparedToDirectPersonToHealthLinkBC: 'Must specify whether worker will be prompted to call HealthLinkBC',
    isPreparedToCleanAndDisinfectRooms: 'Must specify whether rooms can be cleaned and disinfected',
    isWillingToInformManagementAboutCommercialAccommodation: 'Must specify whether management will be informed',
    isAbleToProvideFoodInSafeManner: 'Must specify whether food can be provided in a safe manner',
    isAbleToPerformAdequateHousekeeping: 'Must specify whether adequate housekeeping will be provided',
    isAbleToPerformWasteManagement: 'Must specify whether waste management will be performed',

    // Section six
    doesCertify: 'Must certify this',
    doesAgree: 'Must agree',
  };
  return errorMessages[path] || `Failed validation on ${path}`;
};

export const FormSchema = yup.object().noUnknown('Unknown field for form').shape({
  // Section one
  hasDownloadedBCMinistryAgricultureCovid19Requirements: yup.boolean().typeError(errorMessage).required(errorMessage).test('is-true', errorMessage, (v) => v === true),
  hasCompletedCovid19WorkplaceRiskAssessment: yup.boolean().typeError(errorMessage).required(errorMessage).test('is-true', errorMessage, (v) => v === true),
  hasCreatedCovid19InfectionPreventionAndControlProtocol: yup.boolean().typeError(errorMessage).required(errorMessage).test('is-true', errorMessage, (v) => v === true),

  // Section two
  registeredBusinessName: yup.string().required(errorMessage),
  firstName: yup.string().required(errorMessage),
  lastName: yup.string().required(errorMessage),
  phoneNumber: yup.string().required(errorMessage),
  alternatePhoneNumber: yup.string().nullable(),
  emailAddress: yup.string().required(errorMessage),
  addressLine1: yup.string().required(errorMessage),
  addressLine2: yup.string().nullable(),
  city: yup.string().required(errorMessage),
  province: yup.string().required(errorMessage).oneOf(provinces, 'Invalid province/territory'),
  postalCode: yup.string().required(errorMessage),
  isSameAsBusinessAddress: yup.boolean().typeError(errorMessage).required(errorMessage),
  temporaryForeignWorkerFacilityAddresses: yup.array().when('isSameAsBusinessAddress', {
    is: false,
    then: yup.array().required('Facility information is required').of(
      yup.object().noUnknown('Unknown field for facility information').shape({
        type: yup.string().required('Facility type is required').oneOf(['working', 'housed', 'workingAndHoused'], 'Invalid facility type'),
        addressLine1: yup.string().required('Facility address line 1 is required'),
        addressLine2: yup.string().nullable(),
        city: yup.string().required('Facility city is required'),
        province: yup.string().required('Facility province/territory is required').oneOf(provinces, 'Invalid province/territory'),
        postalCode: yup.string().required('Facility postal code is required'),
      }),
    ).test('is-length', 'Number of facilities must be between 1 and 50', (v) => v.length >= 1 && v.length <= 50),
    otherwise: yup.array().test('is-empty', 'Facility information must be empty', (v) => v && v.length === 0),
  }),

  // Section three
  hasSignage: yup.boolean().typeError(errorMessage).required(errorMessage),
  hasSomeoneIdentified: yup.boolean().typeError(errorMessage).required(errorMessage),
  hasContactedLocalMedicalHealthOfficer: yup.boolean().typeError(errorMessage).required(errorMessage),
  doCommonAreasAllowPhysicalDistancing: yup.boolean().typeError(errorMessage).required(errorMessage),
  bedroomAccommodation: yup.string().nullable().oneOf([null, 'single', 'shared', 'both'], 'Invalid bedroom accommodation'),
  areBedsInRightConfiguration: yup.boolean().typeError(errorMessage).required(errorMessage),
  doesUnderstandNeedsForSelfIsolation: yup.boolean().typeError(errorMessage).required(errorMessage),
  hasSeparateAccommodationForWorker: yup.boolean().typeError(errorMessage).required(errorMessage),
  hasLaundryServices: yup.boolean().typeError(errorMessage).required(errorMessage),
  hasDisposableGloves: yup.boolean().typeError(errorMessage).required(errorMessage),
  hasWasteRemovalSchedule: yup.boolean().typeError(errorMessage).required(errorMessage),
  hasSturdyLeakResistantGarbageBags: yup.boolean().typeError(errorMessage).required(errorMessage),
  hasHandWashingSinks: yup.boolean().typeError(errorMessage).required(errorMessage),
  hasAppropriateSupplyOfSinkWater: yup.boolean().typeError(errorMessage).required(errorMessage),
  hasPlainSoap: yup.boolean().typeError(errorMessage).required(errorMessage),
  hasPaperTowels: yup.boolean().typeError(errorMessage).required(errorMessage),
  hasHandWashingSigns: yup.boolean().typeError(errorMessage).required(errorMessage),
  hasSleepingArrangements: yup.boolean().typeError(errorMessage).required(errorMessage),
  hasPhysicalBarriers: yup.boolean().typeError(errorMessage).required(errorMessage),
  hasScheduleToEnsureTouchAreasAreCleaned: yup.boolean().typeError(errorMessage).required(errorMessage),

  // Section four
  hasMaterialsOnRiskOfExposure: yup.boolean().typeError(errorMessage).required(errorMessage),
  hasMaterialsOnHandWashingPhysicalDistancingCoughSneeze: yup.boolean().typeError(errorMessage).required(errorMessage),
  hasMaterialsOnHandWashingFacilities: yup.boolean().typeError(errorMessage).required(errorMessage),
  hasMaterialsReadyOnHowToSeekFirstAid: yup.boolean().typeError(errorMessage).required(errorMessage),
  hasMaterialsReadyOnHowToReportExposure: yup.boolean().typeError(errorMessage).required(errorMessage),
  hasSchedulesForKitchenEatingAreas: yup.boolean().typeError(errorMessage).required(errorMessage),
  doWorkersHaveOwnDishware: yup.boolean().typeError(errorMessage).required(errorMessage),
  isDishwareWashedImmediately: yup.boolean().typeError(errorMessage).required(errorMessage),

  // Section five
  hasFacilitiesToSeparateAndSelfIsolate: yup.boolean().typeError(errorMessage).required(errorMessage),
  isPreparedToProvideIndividualsExhibitingSymptoms: yup.boolean().typeError(errorMessage).required(errorMessage),
  isPreparedToDirectPersonToHealthLinkBC: yup.boolean().typeError(errorMessage).required(errorMessage),
  isPreparedToCleanAndDisinfectRooms: yup.boolean().typeError(errorMessage).required(errorMessage),
  isWillingToInformManagementAboutCommercialAccommodation: yup.boolean().typeError(errorMessage).required(errorMessage),
  isAbleToProvideFoodInSafeManner: yup.boolean().typeError(errorMessage).required(errorMessage),
  isAbleToPerformAdequateHousekeeping: yup.boolean().typeError(errorMessage).required(errorMessage),
  isAbleToPerformWasteManagement: yup.boolean().typeError(errorMessage).required(errorMessage),

  // Section six
  doesCertify: yup.boolean().typeError(errorMessage).required(errorMessage).test('is-true', errorMessage, (v) => v === true),
  doesAgree: yup.boolean().typeError(errorMessage).required(errorMessage).test('is-true', errorMessage, (v) => v === true),
});
