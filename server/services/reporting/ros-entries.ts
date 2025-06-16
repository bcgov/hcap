/* eslint-disable camelcase */
import dayjs from 'dayjs';
import { addYearToDate } from '../../utils';
import { Program } from '../../constants';

interface RosEntry {
  participant_id;
  participantJoin: {
    body: {
      firstName: string;
      lastName: string;
      program: Program;
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
  rosCompleted: string;
  remainingInSectorOrRoleOrAnother: string;
}

export const mapRosEntries = (rosEntries: RosEntry[]) =>
  rosEntries.map((entry) => ({
    participantId: entry.participant_id,
    firstName: entry.participantJoin?.[0]?.body?.firstName,
    lastName: entry.participantJoin?.[0]?.body?.lastName,
    program: entry.participantJoin?.[0]?.body?.program,
    startDate: dayjs(entry.data?.date).format('YYYY-MM-DD'),
    endDate: addYearToDate(entry.data?.date).format('YYYY-MM-DD'),
    siteStartDate: dayjs(entry.data?.startDate || entry.data?.date).format('YYYY-MM-DD'),
    site: entry.siteJoin?.body?.siteName,
    positionType: entry.data?.positionType || 'Unknown',
    healthRegion: entry.siteJoin?.body?.healthAuthority,
    employmentType: entry.data?.employmentType || 'Unknown',
    rosCompleted: entry.rosCompleted,
    remainingInSectorOrRoleOrAnother: entry.remainingInSectorOrRoleOrAnother,
  }));
