import dayjs from 'dayjs';
import { Program } from '../../constants';
import { dbClient, collections } from '../../db';

type MonitoringReportEntry = {
  id: number;
  // eslint-disable-next-line camelcase
  created_at: string;
  body: {
    preferredLocation: string;
    experienceWithMentalHealthOrSubstanceUse: string;
    currentOrMostRecentIndustry: string;
    reasonForFindingOut: string[];
    indigenous: string;
    program: Program;
  };
};

export const getProgramMonitoringReport = async () => {
  const participants: MonitoringReportEntry[] = await dbClient.db[collections.PARTICIPANTS].find();
  return participants.map((entry) => ({
    participantId: entry.id,
    created_at: dayjs(entry.created_at).format('YYYY-MM-DD'),
    preferredLocation: entry.body?.preferredLocation,
    experienceWithMentalHealthOrSubstanceUse: entry.body?.experienceWithMentalHealthOrSubstanceUse,
    currentOrMostRecentIndustry: entry.body?.currentOrMostRecentIndustry,
    reasonForFindingOut: entry.body?.reasonForFindingOut,
    indigenous: entry.body?.indigenous,
    program: entry.body?.program,
  }));
};
