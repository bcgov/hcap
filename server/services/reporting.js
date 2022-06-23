const dayjs = require('dayjs');
const { addYearToDate } = require('../utils');
const { dbClient, collections } = require('../db');
const keycloak = require('../keycloak');
const { DEFAULT_REGION_NAME } = require('../constants');

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

const mapCohortPsiStatusJoin = (cohortData, psiData, postHireStatus, participantId) => {
  const arr = [];
  if (!cohortData || !psiData || !postHireStatus) return arr;

  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < cohortData.length; i++) {
    const psiId = cohortData[i].psi_id;
    const postHireInfo = postHireStatus.find((status) => status.participant_id === participantId);

    arr.push({
      psi: psiData.find((psi) => psi.id === psiId)?.institute_name || 'N/A',
      cohort: cohortData[i]?.cohort_name,
      startDate: dayjs(cohortData[i]?.start_date).format('YYYY-MM-DD'),
      endDate: dayjs(cohortData[i]?.end_date).format('YYYY-MM-DD'),
      graduation: mapGraduationStatus(postHireInfo?.status) || 'N/A',
      graduationDate:
        postHireInfo?.data?.graduationDate || postHireInfo?.data?.unsuccessfulCohortDate || 'N/A',
      isReturning: mapIntendToReturn(postHireInfo?.data?.continue) || 'N/A',
    });
  }

  return arr;
};

const getParticipantCohortStatus = (entries) => {
  const arr = [];

  // eslint-disable-next-line no-plusplus
  for (let i = 0; i < entries.length; i++) {
    const item = {
      participantId: entries[i].participant_id,
      firstName: entries[i].participantJoin?.[0]?.body?.firstName,
      lastName: entries[i].participantJoin?.[0]?.body?.lastName,
      psi: '',
      cohort: '',
      startDate: '',
      endDate: '',
      graduation: '',
      isReturning: '',
      graduationDate: '',
    };

    const cohortPsiData = mapCohortPsiStatusJoin(
      entries[i].cohortJoin,
      entries[i].psiJoin,
      entries[i].postHireJoin,
      entries[i].participant_id
    );

    // eslint-disable-next-line no-plusplus
    for (let j = 0; j < cohortPsiData.length; j++) {
      item.psi = cohortPsiData[j].psi;
      item.cohort = cohortPsiData[j].cohort;
      item.startDate = cohortPsiData[j].startDate;
      item.endDate = cohortPsiData[j].endDate;
      item.graduation = cohortPsiData[j].graduation;
      item.isReturning = cohortPsiData[j].isReturning;
      item.graduationDate = cohortPsiData[j].graduationDate;
      arr.push(item);
    }
  }

  return arr;
};

const getReport = async () => {
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

const getParticipantsReport = async () => {
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

const getHiredParticipantsReport = async (region = DEFAULT_REGION_NAME) => {
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

const getRejectedParticipantsReport = async () => {
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

const getNoOfferParticipantsReport = async () => {
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

const getRosParticipantsReport = async () => {
  const searchOptions = {};
  const rosEntries = await dbClient.db[collections.ROS_STATUS]
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
    .find(searchOptions);

  return rosEntries.map((entry) => ({
    participantId: entry.participant_id,
    isHCA: true, // TODO: confirm if we need to track this information in our db
    startDate: dayjs(entry.data?.date).format('YYYY-MM-DD'),
    endDate: addYearToDate(entry.data?.date).format('YYYY-MM-DD'),
    siteStartDate: dayjs(entry.data?.date).format('YYYY-MM-DD'), // TODO: update once the support for multiple sites is enabled
    site: entry.siteJoin?.body?.siteName,
    healthRegion: entry.siteJoin?.body?.healthAuthority,
  }));
};

const getPSIPaticipantsReport = async (region) => {
  const searchOptions = {
    status: ['hired'],
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
        type: 'INNER',
        relation: collections.COHORTS,
        on: {
          id: 'cohortParticipantsJoin.cohort_id',
        },
      },
      psiJoin: {
        type: 'INNER',
        relation: collections.POST_SECONDARY_INSTITUTIONS,
        on: {
          id: 'cohortJoin.psi_id',
        },
      },
    })
    .find(searchOptions, {
      order: [
        {
          field: `${collections.PARTICIPANTS}.id`,
          direction: 'DESC',
        },
      ],
    });

  return getParticipantCohortStatus(participantEntries);
};

/**
 * Validation layer to see if the user has access to requested health region
 * @param user data of a user who accesses the endpoints
 * @param {string} regionId health region
 * @return {boolean} true if the user has access
 */
const checkUserRegion = (user, regionId) => user && user.regions?.includes(regionId);

module.exports = {
  getReport,
  getParticipantsReport,
  getHiredParticipantsReport,
  getRejectedParticipantsReport,
  getNoOfferParticipantsReport,
  getRosParticipantsReport,
  getPSIPaticipantsReport,
  checkUserRegion,
  DEFAULT_REGION_NAME,
};
