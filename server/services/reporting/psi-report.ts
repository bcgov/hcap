import { dbClient, collections } from '../../db';
import { DEFAULT_REGION_NAME, DEFAULT_STATUS, ParticipantStatus as ps } from '../../constants';
import {
  getPostHireStatusForParticipant,
  getCohortForParticipant,
  PostHireStatus,
  Cohort,
  CohortParticipant,
} from './participant';

interface ParticipantEntry {
  // eslint-disable-next-line camelcase
  participant_id: number;
  participantJoin: {
    body;
  }[];
  postHireJoin: PostHireStatus[];
  cohortJoin: Cohort[];
  cohortParticipantsJoin: CohortParticipant[];
  psiJoin: {
    id: string;
    // eslint-disable-next-line camelcase
    health_authority: string;
    // eslint-disable-next-line camelcase
    institute_name: string;
  }[];
}

export const getPSIPaticipantsReport = async (region: string) => {
  const searchOptions = {
    status: [ps.HIRED, ps.ARCHIVED],
    current: true,
  };

  if (region !== DEFAULT_REGION_NAME) {
    searchOptions['employerSiteJoin.body.healthAuthority'] = region;
  }

  const participantEntries: ParticipantEntry[] = await dbClient.db[collections.PARTICIPANTS_STATUS]
    .join({
      participantJoin: {
        type: 'INNER',
        relation: collections.PARTICIPANTS,
        on: {
          id: 'participant_id',
        },
      },
      employerSiteJoin: {
        type: 'LEFT OUTER',
        relation: collections.EMPLOYER_SITES,
        on: {
          'body.siteId': 'data.site',
        },
      },
      postHireJoin: {
        type: 'LEFT OUTER',
        relation: collections.PARTICIPANT_POST_HIRE_STATUS,
        on: {
          participant_id: 'participant_id',
        },
      },
      cohortParticipantsJoin: {
        type: 'INNER',
        relation: collections.COHORT_PARTICIPANTS,
        on: {
          participant_id: 'participant_id',
        },
      },
      cohortJoin: {
        type: 'LEFT OUTER',
        relation: collections.COHORTS,
        on: {
          id: 'cohortParticipantsJoin.cohort_id',
        },
      },
      psiJoin: {
        type: 'LEFT OUTER',
        relation: collections.POST_SECONDARY_INSTITUTIONS,
        on: {
          id: 'cohortJoin.psi_id',
        },
      },
    })
    .find(searchOptions, {
      order: [
        {
          field: 'participant_id',
        },
      ],
    });

  return participantEntries.map((entry) => {
    console.log('!#%!#$%!#$%^!#$^', entry.psiJoin);
    const participantData = entry.participantJoin?.[0]?.body;
    const graduationData = getPostHireStatusForParticipant(entry.postHireJoin);
    const cohortData = getCohortForParticipant(entry.cohortJoin, entry.cohortParticipantsJoin);

    return {
      participantId: entry.participant_id,
      firstName: participantData?.firstName,
      lastName: participantData?.lastName,
      psi:
        entry.psiJoin?.find((psi) => psi.id === cohortData.psiId)?.institute_name || DEFAULT_STATUS,
      cohort: cohortData.name,
      startDate: cohortData.startDate,
      endDate: cohortData.endDate,
      graduation: graduationData.status,
      isReturning: graduationData.isReturning,
      graduationDate: graduationData.date,
      psiRegion: entry.psiJoin?.find((psi) => psi.id === cohortData.psiId)?.health_authority,
    };
  });
};
