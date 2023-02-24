import dayjs from 'dayjs';
import { addYearToDate } from '../../utils';

/**
 * Validation layer to see if the user has access to requested health region
 * @param user data of a user who accesses the endpoints
 * @param {string} regionId health region
 * @return {boolean} true if the user has access
 */
export const checkUserRegion = (user, regionId) => user && user.regions?.includes(regionId);

export const mapRosEntries = (rosEntries) =>
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
