const dayjs = require('dayjs');
const { postHireStatuses, rosPositionType, rosEmploymentType } = require('../../constants');

const regions = ['Fraser', 'Interior', 'Northern', 'Vancouver Coastal', 'Vancouver Island'];

const psiData = ({ instituteName, regionIndex, address, postalCode, city }) => ({
  instituteName,
  healthAuthority: regions[regionIndex || 0],
  streetAddress: address || '1815 Blanshard St',
  postalCode: postalCode || 'V2V 3V4',
  city: city || 'Victoria',
});

const today = new Date();

const after = (months, input = today) => new Date(input.setMonth(input.getMonth() + months));

const before = (months) => dayjs().subtract(months, 'month').toDate();

const dateStr = (date = new Date()) => date.toISOString().split('T')[0].replace(/-/gi, '/');

const cohortData = ({ cohortName, startDate = today, endDate, cohortSize, psiID }) => ({
  cohortName,
  startDate: dateStr(startDate),
  endDate: dateStr(endDate || after(6)),
  cohortSize: cohortSize || 1,
  psiID,
});

const participantData = ({
  lastName,
  firstName,
  phoneNumber,
  emailAddress,
  preferredLocation,
  contactedDate,
}) => ({
  lastName: lastName || 'Test',
  firstName: firstName || 'Fresh',
  phoneNumber: phoneNumber || '2502223333',
  emailAddress,
  interested: 'yes',
  nonHCAP: 'yes',
  crcClear: 'yes',
  preferredLocation: preferredLocation || 'Interior',
  contactedDate: contactedDate || dateStr(new Date()),
});

const postHireStatusData = ({ graduationDate, participantId, status }) => ({
  participantId,
  status: status || postHireStatuses.postSecondaryEducationCompleted,
  data: {
    graduationDate,
  },
});

const siteData = ({
  siteName,
  healthAuthority,
  operatorName,
  operatorEmail,
  city,
  isRHO,
  postalCode,
  registeredBusinessName,
  siteId,
}) => ({
  siteId,
  siteName: siteName || 'Test site',
  address: '123 XYZ',
  city: city || 'Victoria',
  isRHO: isRHO || false,
  healthAuthority: healthAuthority || 'Vancouver Island',
  postalCode: postalCode || 'V8V 1M5',
  registeredBusinessName: registeredBusinessName || siteName || 'AAA',
  operatorName: operatorName || siteName || 'Test Operator',
  operatorContactFirstName: 'AABB',
  operatorContactLastName: 'CCC',
  operatorEmail: operatorEmail || 'test@hcpa.fresh',
  operatorPhone: '2219909090',
  siteContactFirstName: 'NNN',
  siteContactLastName: 'PCP',
  siteContactPhone: '2219909091',
  siteContactEmail: 'test.site@hcpa.fresh',
});

const rosData = ({
  positionType = rosPositionType.permanent,
  employmentType = rosEmploymentType.fullTime,
  sameSite = true,
}) => ({
  date: new Date(),
  positionType,
  employmentType,
  sameSite,
});

module.exports = {
  regions,
  psiData,
  dateStr,
  after,
  today,
  cohortData,
  participantData,
  postHireStatusData,
  siteData,
  rosData,
  before,
};
