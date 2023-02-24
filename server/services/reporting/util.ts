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

/**
 * Validation layer to see if the user has access to requested health region
 * @param user data of a user who accesses the endpoints
 * @param regionId health region
 * @return true if the user has access
 */
export const checkUserRegion = (user, regionId: string): boolean =>
  user && user.regions?.includes(regionId);

export const mapRosEntries = (rosEntries: RosEntry[]) =>
  rosEntries.map((entry) => ({
    participantId: entry.participant_id,
    firstName: entry.participantJoin?.[0]?.body?.firstName,
    lastName: entry.participantJoin?.[0]?.body?.lastName,
    isHCA: true,
    startDate: dayjs(entry.data?.date).format('YYYY-MM-DD'),
    endDate: addYearToDate(entry.data?.date).format('YYYY-MM-DD'),
    siteStartDate: dayjs(entry.data?.startDate || entry.data?.date).format('YYYY-MM-DD'),
    site: entry.siteJoin?.body?.siteName,
    healthRegion: entry.siteJoin?.body?.healthAuthority,
    positionType: entry.data?.positionType || 'Unknown',
    employmentType: entry.data?.employmentType || 'Unknown',
  }));
