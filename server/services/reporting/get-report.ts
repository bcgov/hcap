import { dbClient, collections } from '../../db';
import { ParticipantStatus as ps } from '../../constants';

export const getReport = async () => {
  const total: number = await dbClient.db[collections.PARTICIPANTS].countDoc({});
  const qualified: number = await dbClient.db[collections.PARTICIPANTS].countDoc({
    interested: 'yes',
  });

  const inProgressEntries = await dbClient.db[collections.PARTICIPANTS_STATUS]
    .join({
      hiredOrArchivedJoin: {
        type: 'LEFT OUTER',
        relation: collections.PARTICIPANTS_STATUS,
        on: {
          participant_id: 'participant_id',
          status: [ps.HIRED, ps.ARCHIVED],
          current: true,
        },
      },
    })
    .find({
      current: true,
      status: ['prospecting', 'interviewing', 'offer_made'],
      'hiredOrArchivedJoin.status': null,
    });

  const hiredPerRegionRes = await dbClient.db[collections.PARTICIPANTS_STATUS]
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
          status: ps.ARCHIVED,
          current: true,
          'data.type': 'duplicate',
        },
      },
    })
    .find({
      status: [ps.HIRED],
      'archivedJoin.status': null,
      'siteJoin.id <>': null,
    });
  const hiredPerRegion: { [key: string]: number } = hiredPerRegionRes.reduce((a, v) => {
    const region = v.siteJoin?.body?.healthAuthority || 'Unknown';
    if (typeof a[region] === 'undefined') return { ...a, [region]: 1 };
    return { ...a, [region]: a[region] + 1 };
  }, {});

  const inProgress = [...new Set(inProgressEntries.map((i) => i.participant_id))].length;

  const hired: number = await dbClient.db[collections.PARTICIPANTS_STATUS]
    .join({
      archivedJoin: {
        type: 'LEFT OUTER',
        relation: collections.PARTICIPANTS_STATUS,
        on: {
          participant_id: 'participant_id',
          status: ps.ARCHIVED,
          current: true,
          'data.type': 'duplicate',
        },
      },
    })
    .count({
      status: [ps.HIRED],
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
