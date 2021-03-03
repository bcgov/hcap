const { dbClient, collections } = require('../db');
const keycloak = require('../keycloak');

const getReport = async () => {
  const total = await dbClient.db[collections.PARTICIPANTS].countDoc({});
  const qualified = await dbClient.db[collections.PARTICIPANTS].countDoc({ interested: 'yes' });

  const inProgressEntries = await dbClient.db[collections.PARTICIPANTS_STATUS].join({
    hiredJoin: {
      type: 'LEFT OUTER',
      relation: collections.PARTICIPANTS_STATUS,
      on: {
        participant_id: 'participant_id',
        status: 'hired',
        current: true,
      },
    },
  }).find({
    current: true,
    status: ['prospecting', 'interviewing', 'offer_made'],
    'hiredJoin.status': null,
  });

  let hiredPerRegion = await dbClient.db[collections.PARTICIPANTS_STATUS].join({
    siteJoin: {
      type: 'LEFT OUTER',
      relation: collections.EMPLOYER_SITES,
      decomposeTo: 'object',
      on: { 'body.siteId': 'data.site' },
    },
  }).find({
    current: true,
    status: 'hired',
  });
  hiredPerRegion = hiredPerRegion.reduce((a, v) => {
    const region = v.siteJoin?.body?.healthAuthority || 'Unknown';
    if (typeof a[region] === 'undefined') return { ...a, [region]: 1 };
    return { ...a, [region]: a[region] + 1 };
  }, {});

  const inProgress = [...new Set(inProgressEntries.map((i) => i.participant_id))].length;

  const hired = await dbClient.db[collections.PARTICIPANTS_STATUS].count({
    status: ['hired'],
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
  const inProgressEntries = await dbClient.db[collections.PARTICIPANTS_STATUS].join({
    participantJoin: {
      type: 'LEFT OUTER',
      relation: collections.PARTICIPANTS,
      on: {
        id: 'participant_id',
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
    employerUserJoin: {
      type: 'LEFT OUTER',
      relation: collections.USERS,
      on: {
        'body.keycloakId': 'employer_id',
      },
    },
  }).find({
    current: true,
    status: ['prospecting', 'interviewing', 'offer_made'],
    'hiredJoin.status': null,
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
    employerhealthRegion: [...new Set(getFirst(entry.employerUserJoin)?.body?.sites.map((id) => healthAuthorities[id]))].join('; '),
  }));
};

const getHiredParticipantsReport = async () => {
  const users = await keycloak.getUsers();

  const hiredEntries = await dbClient.db[collections.PARTICIPANTS_STATUS].join({
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
  }).find({
    current: true,
    status: 'hired',
    // 'employerSiteJoin.body.siteId::int >': 0, // Ensures that at least one site is found
  });

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
  }));
};

const getRejectedParticipantsReport = async () => {
  const rejectedEntries = await dbClient.db[collections.PARTICIPANTS_STATUS].join({
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
  }).find({
    current: true,
    status: 'rejected',
    'hiredJoin.status': null,
  });

  const kcUser = await keycloak.getUsers();
  const sites = await dbClient.db[collections.EMPLOYER_SITES].findDoc({});

  return rejectedEntries.map((entry) => {
    const user = entry.employerJoin.map((employer) => employer.body)[0];
    return {
      participantId: entry.participant_id,
      employerId: entry.employer_id,
      participantInfo: entry.participantJoin[0].body,
      employerInfo: {
        ...user,
        email: kcUser.find((item) => item.id === entry.employer_id)?.email,
        regions: user.sites.map(
          (site) => sites.find((item) => item.siteId === site).healthAuthority,
        ),
      },
      rejection: entry.data,
      date: entry.created_at,
    };
  }).filter((entry) => entry.participantInfo.interested !== 'withdrawn');
};

const getNoOfferParticipantsReport = async () => {
  const currentEntries = await dbClient.db[collections.PARTICIPANTS_STATUS].join({
    participantJoin: {
      type: 'LEFT OUTER',
      relation: collections.PARTICIPANTS,
      on: {
        id: 'participant_id',
      },
    },
  }).find({
    current: true,
  });

  const idToExcludedStatusMap = {};
  const invalidStatus = ['hired', 'offer_made'];
  const offerlessParticipants = new Set();

  currentEntries.forEach((entry) => {
    const pptData = entry.participantJoin[0].body;

    // here we need to keep track of whether the status is valid. It cannot be
    // added to the set because then if would make the participant object
    // non-unique. true implies hired or offer made, false implies otherwise
    if (!idToExcludedStatusMap[entry.participant_id]) {
      idToExcludedStatusMap[entry.participant_id] = invalidStatus.includes(entry.status);
    }

    offerlessParticipants.add({
      id: entry.participant_id,
      email: pptData.emailAddress,
      lastUpdated: pptData.userUpdatedAt,
      interested: pptData.interested,
      FSA: pptData.postalCodeFsa,
      regions: pptData.preferredLocation.split(';'),
    });
  });

  // Remove entries from the set if any of their statuses match the removal
  // conditions

  console.log('initial state');
  console.log('offerlessParticipants');
  console.log(offerlessParticipants);

  offerlessParticipants.forEach((ppt) => {
    if (idToExcludedStatusMap[ppt.id]
      || ppt.regions === ['Northern']
      || ppt.interested === 'withdrawn'
    ) offerlessParticipants.delete(ppt);
  });

  console.log('final state');
  console.log('offerlessParticipants');
  console.log(offerlessParticipants);

  return offerlessParticipants;
};

module.exports = {
  getReport,
  getParticipantsReport,
  getHiredParticipantsReport,
  getRejectedParticipantsReport,
  getNoOfferParticipantsReport,
};
