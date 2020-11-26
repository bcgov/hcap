const yup = require('yup');
const { healthRegions } = require('./common');

const getEmployeeSiteSchema = (errorDisplay) => yup.object().noUnknown('Unknown field in site data').shape({
  siteId: yup.number(errorDisplay),
  siteName: yup.string().nullable(errorDisplay),
  earlyAdaptorAllocation: yup.number().nullable(errorDisplay),
  address: yup.string().nullable(errorDisplay),
  city: yup.string().nullable(errorDisplay),
  healthAuthority: yup.string().nullable(errorDisplay).oneOf(healthRegions, 'Invalid location'),
  postalCode: yup.string().nullable(errorDisplay).matches(/(^[A-Za-z]\d[A-Za-z]\s?\d[A-Za-z]\d)$/, { excludeEmptyString: true, message: 'Format as A1A 1A1' }),
  registeredBusinessName: yup.string().nullable(errorDisplay),
  operatorContactFirstName: yup.string().nullable(errorDisplay),
  operatorContactLastName: yup.string().nullable(errorDisplay),
  operatorEmail: yup.string().email('should be a valid email address').nullable(errorDisplay),
  operatorPhone: yup.string().matches(/^([0-9]{10})$/, { excludeEmptyString: true, message: 'Phone number must be provided as 10 digits' }).nullable(errorDisplay),
  siteContactFirstName: yup.string().nullable(errorDisplay),
  siteContactLastName: yup.string().nullable(errorDisplay),
  siteContactPhoneNumber: yup.string().matches(/(^[0-9]{10})$/, { excludeEmptyString: true, message: 'Phone number must be provided as 10 digits' }).nullable(errorDisplay),
  siteContactEmailAddress: yup.string().email('should be a valid email address').nullable(errorDisplay),
});

module.exports = {
  getEmployeeSiteSchema,
};
