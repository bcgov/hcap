import { dbClient, collections } from '../../db';
import { mapRosEntries } from './ros-entries';

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

export const getHARosMilestonesReport = async (region: string) => {
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
