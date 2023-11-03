import dayjs from 'dayjs';
import _ from 'lodash';
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
  return _.flatten(
    participants.map((entry) => {
      const regions = entry.body?.preferredLocation?.split(';') ?? [];
      return regions.map((region) => ({
        participantId: entry.id,
        created_at: dayjs(entry.created_at).format('YYYY-MM-DD'),
        preferredLocation: region,
        experienceWithMentalHealthOrSubstanceUse:
          entry.body?.experienceWithMentalHealthOrSubstanceUse,
        currentOrMostRecentIndustry: entry.body?.currentOrMostRecentIndustry,
        reasonForFindingOut: entry.body?.reasonForFindingOut,
        indigenous: entry.body?.indigenous,
        program: entry.body?.program,
      }));
    })
  );
};
