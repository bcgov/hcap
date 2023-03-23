/* eslint-disable camelcase */
import dayjs from 'dayjs';
import { addYearToDate } from '../../utils';

interface RosEntry {
  participant_id;
  participantJoin: {
    body: {
      firstName: string;
      lastName: string;
    };
  }[];
  siteJoin: {
    body: {
      siteName: string;
      healthAuthority: string;
    };
  };
  data: {
    date: Date | string;
    startDate: Date | string;
    positionType?: string;
    employmentType?: string;
  };
}

export const mapRosEntries = (rosEntries: RosEntry[]) =>
  rosEntries.map((entry) => ({
    participantId: entry.participant_id,
    firstName: entry.participantJoin?.[0]?.body?.firstName,
    lastName: entry.participantJoin?.[0]?.body?.lastName,
    startDate: dayjs(entry.data?.date).format('YYYY-MM-DD'),
    endDate: addYearToDate(entry.data?.date).format('YYYY-MM-DD'),
    siteStartDate: dayjs(entry.data?.startDate || entry.data?.date).format('YYYY-MM-DD'),
    site: entry.siteJoin?.body?.siteName,
    positionType: entry.data?.positionType || 'Unknown',
    healthRegion: entry.siteJoin?.body?.healthAuthority,
    employmentType: entry.data?.employmentType || 'Unknown',
  }));
