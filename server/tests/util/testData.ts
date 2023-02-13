import dayjs from 'dayjs';

import { postHireStatuses, rosPositionType, rosEmploymentType } from '../../constants';

interface participantDataArgs {
  lastName?: string;
  firstName?: string;
  phoneNumber?: string;
  emailAddress?: string;
  preferredLocation?: string;
  contactedDate?: string;
}

interface psiDataArgs {
  instituteName?: string;
  regionIndex?: number;
  address?: string;
  postalCode?: string;
  city?: string;
}

interface cohortDataArgs {
  cohortName: string;
  startDate?: Date;
  endDate?: Date;
  cohortSize?: number;
  psiID;
}

interface siteDataArgs {
  siteName?: string;
  healthAuthority?: string;
  operatorName?: string;
  operatorEmail?: string;
  city?: string;
  isRHO?: boolean;
  postalCode?: string;
  registeredBusinessName?: string;
  siteId;
}

export const regions = ['Fraser', 'Interior', 'Northern', 'Vancouver Coastal', 'Vancouver Island'];

export const psiData = ({
  instituteName,
  regionIndex,
  address,
  postalCode,
  city,
}: psiDataArgs) => ({
  instituteName,
  healthAuthority: regions[regionIndex || 0],
  streetAddress: address || '1815 Blanshard St',
  postalCode: postalCode || 'V2V 3V4',
  city: city || 'Victoria',
});

export const today = new Date();

export const after = (months, input = today) => new Date(input.setMonth(input.getMonth() + months));

export const before = (months) => dayjs().subtract(months, 'month').toDate();

export const dateStr = (date = new Date()) => date.toISOString().split('T')[0].replace(/-/gi, '/');

export const cohortData = ({
  cohortName,
  startDate = today,
  endDate,
  cohortSize,
  psiID,
}: cohortDataArgs) => ({
  cohortName,
  startDate: dateStr(startDate),
  endDate: dateStr(endDate || after(6)),
  cohortSize: cohortSize || 1,
  psiID,
});

export const participantData = ({
  lastName,
  firstName,
  phoneNumber,
  emailAddress,
  preferredLocation,
  contactedDate,
}: participantDataArgs) => ({
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

export const postHireStatusData = ({ graduationDate, participantId, status }) => ({
  participantId,
  status: status || postHireStatuses.postSecondaryEducationCompleted,
  data: {
    graduationDate,
  },
});

export const siteData = ({
  siteName,
  healthAuthority,
  operatorName,
  operatorEmail,
  city,
  isRHO,
  postalCode,
  registeredBusinessName,
  siteId,
}: siteDataArgs) => ({
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

export const rosData = ({
  positionType = rosPositionType.permanent,
  employmentType = rosEmploymentType.fullTime,
  sameSite = true,
}) => ({
  date: new Date(),
  positionType,
  employmentType,
  sameSite,
});
