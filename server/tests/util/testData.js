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

module.exports = {
  regions,
  psiData,
  dateStr,
  after,
  today,
  cohortData,
  participantData,
};
