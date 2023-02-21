import dayjs from 'dayjs';
import { addYearToDate } from '../utils';
import { dbClient, collections } from '../db';
import keycloak from '../keycloak';
import { DEFAULT_REGION_NAME, DEFAULT_STATUS } from '../constants';

export { DEFAULT_REGION_NAME } from '../constants';

const mapGraduationStatus = (status) => {
  switch (status) {
    case 'cohort_unsuccessful':
      return 'Unsuccessful cohort';
    case 'post_secondary_education_completed':
      return 'Graduated';
    default:
      return status;
  }
};

const mapIntendToReturn = (value) => {
  switch (value) {
    case 'continue_yes':
      return 'Yes';
    case 'continue_no':
      return 'No';
    default:
      return value;
  }
};

const mapRosEntries = (rosEntries) =>
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

const getPostHireStatusForParticipant = (postHireStatuses) => {
  const graduationStatus = {
    isReturning: DEFAULT_STATUS,
    status: DEFAULT_STATUS,
    date: DEFAULT_STATUS,
  };
  if (!postHireStatuses) return graduationStatus;
  const currentStatus = postHireStatuses.find((status) => status.is_current);
  if (!currentStatus) return graduationStatus;

  return {
    isReturning: mapIntendToReturn(currentStatus.data?.continue) || DEFAULT_STATUS,
    status: mapGraduationStatus(currentStatus.status) || DEFAULT_STATUS,
    date:
      currentStatus.data?.unsuccessfulCohortDate ||
      currentStatus.data?.graduationDate ||
      DEFAULT_STATUS,
  };
};

const getCohortForParticipant = (cohorts, cohortParticipants) => {
  const cohortData = {
    psiId: DEFAULT_STATUS,
    name: DEFAULT_STATUS,
    startDate: DEFAULT_STATUS,
    endDate: DEFAULT_STATUS,
  };
  if (!cohorts || !cohortParticipants) return cohortData;

  const cohortId = cohortParticipants.find((cohortMap) => cohortMap.is_current)?.cohort_id;
  if (!cohortId) return cohortData;
  const currentCohort = cohorts.find((cohort) => cohort.id === cohortId);

  return {
    psiId: currentCohort.psi_id || DEFAULT_STATUS,
    name: currentCohort.cohort_name || DEFAULT_STATUS,
    startDate: dayjs(currentCohort.start_date).format('YYYY/MM/DD') || DEFAULT_STATUS,
    endDate: dayjs(currentCohort.end_date).format('YYYY/MM/DD') || DEFAULT_STATUS,
  };
};

export const getReport = async () => {
  const total = await dbClient.db[collections.PARTICIPANTS].countDoc({});
  const qualified = await dbClient.db[collections.PARTICIPANTS].countDoc({ interested: 'yes' });

  const inProgressEntries = await dbClient.db[collections.PARTICIPANTS_STATUS]
    .join({
      hiredOrArchivedJoin: {
        type: 'LEFT OUTER',
        relation: collections.PARTICIPANTS_STATUS,
        on: {
          participant_id: 'participant_id',
          status: ['hired', 'archived'],
          current: true,
        },
      },
    })
    .find({
      current: true,
      status: ['prospecting', 'interviewing', 'offer_made'],
      'hiredOrArchivedJoin.status': null,
    });

  let hiredPerRegion = await dbClient.db[collections.PARTICIPANTS_STATUS]
    .join({
      siteJoin: {
        type: 'LEFT OUTER',
        relation: collections.EMPLOYER_SITES,
        decomposeTo: 'object',
        on: { 'body.siteId': 'data.site' },
      },
      archivedJoin: {
        type: 'LEFT OUTER',
        relation: collections.PARTICIPANTS_STATUS,
        on: {
          participant_id: 'participant_id',
          status: 'archived',
          current: true,
          'data.type': 'duplicate',
        },
      },
    })
    .find({
      status: ['hired'],
      'archivedJoin.status': null,
      'siteJoin.id <>': null,
    });
  hiredPerRegion = hiredPerRegion.reduce((a, v) => {
    const region = v.siteJoin?.body?.healthAuthority || 'Unknown';
    if (typeof a[region] === 'undefined') return { ...a, [region]: 1 };
    return { ...a, [region]: a[region] + 1 };
  }, {});

  const inProgress = [...new Set(inProgressEntries.map((i) => i.participant_id))].length;

  const hired = await dbClient.db[collections.PARTICIPANTS_STATUS]
    .join({
      archivedJoin: {
        type: 'LEFT OUTER',
        relation: collections.PARTICIPANTS_STATUS,
        on: {
          participant_id: 'participant_id',
          status: 'archived',
          current: true,
          'data.type': 'duplicate',
        },
      },
    })
    .count({
      status: ['hired'],
      'archivedJoin.status': null,
    });

  return {
    total,
    qualified,
    inProgress,
    hired,
    hiredPerRegion,
  };
};

export const getParticipantsReport = async () => {
  const inProgressEntries = await dbClient.db[collections.PARTICIPANTS_STATUS]
    .join({
      participantJoin: {
        type: 'LEFT OUTER',
        relation: collections.PARTICIPANTS,
        on: {
          id: 'participant_id',
        },
      },
      hiredOrArchivedJoin: {
        type: 'LEFT OUTER',
        relation: collections.PARTICIPANTS_STATUS,
        on: {
          participant_id: 'participant_id',
          status: ['hired', 'archived'],
          current: true,
        },
      },
      employerUserJoin: {
        type: 'LEFT OUTER',
        relation: collections.USERS,
        on: {
          'body.keycloakId': 'employer_id',
        },
      },
    })
    .find({
      current: true,
      status: ['prospecting', 'interviewing', 'offer_made'],
      'hiredOrArchivedJoin.status': null,
    });

  const healthAuthorities = [];
  (await dbClient.db[collections.EMPLOYER_SITES].find({})).forEach((item) => {
    healthAuthorities[item.body.siteId] = item.body.healthAuthority;
  });

  const users = await keycloak.getUsers();

  const getFirst = (array) => array?.length > 0 && array[0];

  return inProgressEntries.map((entry) => ({
    participantId: entry.participant_id,
    participantFsa: getFirst(entry.participantJoin)?.body.postalCodeFsa,
    employerId: entry.employer_id,
    employerEmail: users.find((user) => user.id === entry.employer_id)?.email,
    employerhealthRegion: [
      ...new Set(getFirst(entry.employerUserJoin)?.body?.sites.map((id) => healthAuthorities[id])),
    ].join('; '),
  }));
};

export const getHiredParticipantsReport = async (region = DEFAULT_REGION_NAME) => {
  const users = await keycloak.getUsers();

  const searchOptions = {
    status: ['hired'],
    'duplicateArchivedJoin.status': null,
    // 'employerSiteJoin.body.siteId::int >': 0, // Ensures that at least one site is found
  };

  if (region !== DEFAULT_REGION_NAME) {
    searchOptions['employerSiteJoin.body.healthAuthority'] = region;
  }

  const hiredEntries = await dbClient.db[collections.PARTICIPANTS_STATUS]
    .join({
      participantJoin: {
        type: 'LEFT OUTER',
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
      duplicateArchivedJoin: {
        type: 'LEFT OUTER',
        relation: collections.PARTICIPANTS_STATUS,
        on: {
          participant_id: 'participant_id',
          status: 'archived',
          current: true,
          'data.type': 'duplicate',
        },
      },
      archivedJoin: {
        type: 'LEFT OUTER',
        relation: collections.PARTICIPANTS_STATUS,
        on: {
          participant_id: 'participant_id',
          status: 'archived',
          current: true,
          'data.type <>': 'duplicate',
        },
      },
    })
    .find(searchOptions);

  return hiredEntries.map((entry) => ({
    participantId: entry.participant_id,
    firstName: entry.participantJoin?.[0]?.body?.firstName,
    lastName: entry.participantJoin?.[0]?.body?.lastName,
    participantFsa: entry.participantJoin?.[0]?.body?.postalCodeFsa,
    employerId: entry.employer_id,
    employerEmail: users.find((user) => user.id === entry.employer_id)?.email,
    hcapPosition: !(entry.data?.nonHcapOpportunity || false),
    positionType: entry.data?.positionType,
    positionTitle: entry.data?.positionTitle,
    employerRegion: entry.employerSiteJoin?.[0]?.body?.healthAuthority,
    employerSite: entry.employerSiteJoin?.[0]?.body?.siteName,
    startDate: entry.data?.startDate,
    isRHO: entry.employerSiteJoin?.[0]?.body?.isRHO,
    withdrawReason: entry.archivedJoin?.[0]?.data?.reason,
    withdrawDate: entry.archivedJoin?.[0]?.data?.endDate,
    rehire: entry.archivedJoin?.[0]?.data?.rehire,
  }));
};

export const getRejectedParticipantsReport = async () => {
  const rejectedEntries = await dbClient.db[collections.PARTICIPANTS_STATUS]
    .join({
      participantJoin: {
        type: 'LEFT OUTER',
        relation: collections.PARTICIPANTS,
        on: {
          id: 'participant_id',
        },
      },
      employerJoin: {
        type: 'LEFT OUTER',
        relation: collections.USERS,
        on: {
          'body.keycloakId': 'employer_id',
        },
      },
      hiredJoin: {
        type: 'LEFT OUTER',
        relation: collections.PARTICIPANTS_STATUS,
        on: {
          participant_id: 'participant_id',
          status: 'hired',
          current: true,
        },
      },
    })
    .find({
      current: true,
      status: 'rejected',
      'hiredJoin.status': null,
    });

  const kcUser = await keycloak.getUsers();
  const sites = await dbClient.db[collections.EMPLOYER_SITES].findDoc({});

  return rejectedEntries
    .map((entry) => {
      const user = entry.employerJoin.map((employer) => employer.body)[0];
      return {
        participantId: entry.participant_id,
        employerId: entry.employer_id,
        participantInfo: entry.participantJoin[0].body,
        employerInfo: {
          ...user,
          email: kcUser.find((item) => item.id === entry.employer_id)?.email,
          regions: user.sites.map(
            (site) => sites.find((item) => item.siteId === site).healthAuthority
          ),
        },
        rejection: entry.data,
        date: entry.created_at,
      };
    })
    .filter((entry) => entry.participantInfo.interested !== 'withdrawn');
};

export const getNoOfferParticipantsReport = async () => {
  const participants = await dbClient.db[collections.PARTICIPANTS]
    .join({
      statusJoin: {
        type: 'LEFT OUTER',
        relation: collections.PARTICIPANTS_STATUS,
        on: {
          participant_id: 'id',
          current: true,
        },
      },
    })
    .find({
      or: [{ 'body.interested <>': ['withdrawn', 'no'] }, { 'body.interested IS': null }],
      'body.preferredLocation <>': 'Northern',
    });

  const noOffer = participants.filter((participant) =>
    participant.statusJoin.every((status) => !['hired', 'offer_made'].includes(status.status))
  );

  return noOffer.map((participant) => ({
    id: participant.id,
    ...participant.body,
  }));
};

export const getMohRosMilestonesReport = async () => {
  const entries = await dbClient.db[collections.ROS_STATUS]
    .join({
      participantJoin: {
        type: 'LEFT OUTER',
        relation: collections.PARTICIPANTS,
        on: {
          id: 'participant_id',
        },
      },
      siteJoin: {
        type: 'LEFT OUTER',
        decomposeTo: 'object',
        relation: collections.EMPLOYER_SITES,
        on: {
          id: 'site_id',
        },
      },
    })
    .find(
      {},
      {
        order: [
          {
            field: 'participant_id',
          },
        ],
      }
    );

  return mapRosEntries(entries);
};

export const getHARosMilestonesReport = async (region) => {
  const sameSiteRosEntries = await dbClient.db[collections.ROS_STATUS]
    .join({
      participantJoin: {
        type: 'LEFT OUTER',
        relation: collections.PARTICIPANTS,
        on: {
          id: 'participant_id',
        },
      },
      siteJoin: {
        type: 'LEFT OUTER',
        decomposeTo: 'object',
        relation: collections.EMPLOYER_SITES,
        on: {
          id: 'site_id',
        },
      },
    })
    .find(
      {
        'siteJoin.body.healthAuthority': region,
        status: 'assigned-same-site',
      },
      {
        order: [
          {
            field: 'participant_id',
          },
        ],
      }
    );

  // HAs need only see the participants in their health region + participants who changed their health region and now assigned to a site withing HAs view
  // select participants outside HAs region for changed sites
  const editedEntries = await dbClient.db[collections.ROS_STATUS]
    .join({
      participantJoin: {
        type: 'LEFT OUTER',
        relation: collections.PARTICIPANTS,
        on: {
          id: 'participant_id',
        },
      },
      siteJoin: {
        type: 'LEFT OUTER',
        decomposeTo: 'object',
        relation: collections.EMPLOYER_SITES,
        on: {
          id: 'site_id',
        },
      },
    })
    .find({
      participant_id: sameSiteRosEntries.map((entry) => entry.participant_id),
      // data.user <> NULL - indicated that the entry was modified by another user at some point
      'data.user <>': 'NULL',
    });

  // see if we need to display this information for HA based on what participants are included
  // if participants are already visible to HA - include information about their previous sites
  let rosEntries = sameSiteRosEntries;
  if (editedEntries.length > 0) {
    rosEntries = rosEntries.concat(editedEntries);
    rosEntries.sort((a, b) => a.participant_id - b.participant_id);
  }

  return mapRosEntries(rosEntries);
};

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

/**
 * Validation layer to see if the user has access to requested health region
 * @param user data of a user who accesses the endpoints
 * @param {string} regionId health region
 * @return {boolean} true if the user has access
 */
export const checkUserRegion = (user, regionId) => user && user.regions?.includes(regionId);
