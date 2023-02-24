import { dbClient, collections } from '../../db';

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
