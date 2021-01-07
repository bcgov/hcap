const { dbClient, collections } = require('../db');

const getReport = async () => {
  const total = await dbClient.db[collections.PARTICIPANTS].countDoc({});
  const qualified = await dbClient.db[collections.PARTICIPANTS].countDoc({
    interested: 'yes',
    crcClear: 'yes',
  });
  const inProgress = await dbClient.db[collections.PARTICIPANTS_STATUS].count({
    current: true,
    status: ['prospecting', 'interviewing', 'offer made'],
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
