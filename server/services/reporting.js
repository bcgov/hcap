const { dbClient, collections } = require('../db');
const keycloak = require('../keycloak');

const getReport = async () => {
  const total = await dbClient.db[collections.PARTICIPANTS].countDoc({});
  const qualified = await dbClient.db[collections.PARTICIPANTS].countDoc({
    interested: 'yes',
    crcClear: 'yes',
  });

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

  const inProgress = [...new Set(inProgressEntries.map((i) => i.participant_id))].length;

  const hired = await dbClient.db[collections.PARTICIPANTS_STATUS].count({
    status: ['hired'],
  });

  return {
    total,
    qualified,
    inProgress,
    hired,
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
    healthAuthorities[item.id] = item.body.healthAuthority;
  });

  const users = await keycloak.getUsers();

  const getFirst = (array) => array?.length > 0 && array[0];

  return inProgressEntries.map((entry) => ({
    participantId: entry.participant_id,
    participantFsa: getFirst(entry.participantJoin)?.body.postalCodeFsa,
    employerId: entry.employer_id,
    employerEmail: users.find((user) => user.id === entry.employer_id)?.email,
    employerhealthRegion: getFirst(entry.employerUserJoin)?.body?.sites.map((id) => healthAuthorities[id]).join('; '),
  }));
};

module.exports = { getReport, getParticipantsReport };
