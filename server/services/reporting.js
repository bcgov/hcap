const { dbClient, collections } = require('../db');

const getReport = async () => {
  const total = await dbClient.db[collections.PARTICIPANTS].countDoc({});
  const qualified = await dbClient.db[collections.PARTICIPANTS].countDoc({
    interested: 'yes',
    crcClear: 'yes',
  });
  const inProgressEntries = await dbClient.db[collections.PARTICIPANTS_STATUS].find({
    current: true,
    status: ['prospecting', 'interviewing', 'offer made'],
  }, {
    columns: ['participant_id'],
    distinct: true,
  });

  const inProgressIDs = [];
  inProgressEntries.forEach((entry) => {
    if (!inProgressIDs.includes(entry.participant_id)) inProgressIDs.push(entry.participant_id);
  });

  const hired = await dbClient.db[collections.PARTICIPANTS_STATUS].count({
    status: ['hired'],
  });

  return {
    total,
    qualified,
    inProgress: inProgressIDs.length,
    hired,
  };
};

module.exports = { getReport };
