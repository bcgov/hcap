import { dbClient, collections } from '../../db';
import { DEFAULT_REGION_NAME, DEFAULT_STATUS } from '../../constants';
import { getPostHireStatusForParticipant, getCohortForParticipant } from './participant';

export const getPSIPaticipantsReport = async (region) => {
  const searchOptions = {
    status: ['hired', 'archived'],
    current: true,
  };

  if (region !== DEFAULT_REGION_NAME) {
    searchOptions['employerSiteJoin.body.healthAuthority'] = region;
  }

  const participantEntries = await dbClient.db[collections.PARTICIPANTS_STATUS]
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
    };
  });
};
