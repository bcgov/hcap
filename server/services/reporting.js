const { dbClient, collections } = require('../db');

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

module.exports = { getReport };
