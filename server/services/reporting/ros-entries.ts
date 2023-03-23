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
  participantStatusJoin: {
    status: string;
    current: boolean;
    data: {
      type: string;
      confirmed: boolean;
    };
  };
  data: {
    date: Date | string;
    startDate: Date | string;
    positionType?: string;
    employmentType?: string;
  };
}

// getROSCompleted = (entry: RosEntry) => {
//   return entry.participantStatusJoin?.current && entry.participantStatusJoin?.status === "rosComplete"
// };

// {"site": 4, "type": "rosComplete", "reason": "Completed all HCAP requirements", "rehire": "Yes", "status": "Return of service complete", "endDate": "2022/01/01", "confirmed": true}

export const mapRosEntries = (rosEntries: RosEntry[]) =>
  rosEntries.map((entry) => {
    console.log(entry.participantStatusJoin?.status);
    console.log(entry.participantStatusJoin);

    return {
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
      rosCompleted:
        entry.participantStatusJoin?.status === 'archived' &&
        entry.participantStatusJoin.data?.type === 'rosComplete' &&
        entry.participantStatusJoin?.current &&
        entry.participantStatusJoin.data?.confirmed,
    };
  });
