const { dbClient, collections } = require('../db');

const getReport = async () => {
  const total = await dbClient.db[collections.PARTICIPANTS].countDoc({});
  const qualified = await dbClient.db[collections.PARTICIPANTS].countDoc({
    interested: 'yes',
    crcClear: 'yes',
  });

  /// ///////////
  const inProgress1 = await dbClient.db[collections.PARTICIPANTS_STATUS].join({
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

  console.log(inProgress1);
  /// ///////////

  const inProgress = await dbClient.db[collections.PARTICIPANTS_STATUS].count({
    current: true,
    status: ['prospecting', 'interviewing', 'offer_made'],
  }, {
    fields: ['participant_id'],
    distinct: true,
  });

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
