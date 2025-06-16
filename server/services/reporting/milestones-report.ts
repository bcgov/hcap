import { dbClient, collections } from '../../db';
import { mapRosEntries } from './ros-entries';
import logger from '../../logger';

export const getMohRosMilestonesReport = async () => {
  try {
    // First, get all ROS status entries with their related data
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

    // If no entries found, return empty array
    if (!entries || entries.length === 0) {
      return [];
    }

    // Process each entry to get ROS completion status individually
    const enhancedEntries = await Promise.all(
      entries.map(async (entry) => {
        // Get ROS completion status for this specific participant
        const rosCompletionStatus = await dbClient.db[collections.PARTICIPANTS_STATUS].findOne(
          {
            participant_id: entry.participant_id,
            status: 'archived',
            'data.type': 'rosComplete',
            'data.confirmed': 'true',
            current: true,
          },
          {
            order: [{ field: 'id', direction: 'desc' }],
          }
        );

        const rosCompleted = rosCompletionStatus ? 'TRUE' : 'FALSE';
        const remainingInSectorOrRoleOrAnother =
          rosCompletionStatus?.data?.remainingInSectorOrRoleOrAnother || 'Unknown';

        return {
          ...entry,
          rosCompleted,
          remainingInSectorOrRoleOrAnother,
        };
      })
    );

    return mapRosEntries(enhancedEntries);
  } catch (error) {
    logger.error(`Error generating MoH ROS milestones report: ${error.message}`);
    throw error;
  }
};

export const getHARosMilestonesReport = async (region: string) => {
  try {
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

    // If no entries found in the region, return empty array
    if (!sameSiteRosEntries || sameSiteRosEntries.length === 0) {
      return [];
    }

    // Get the IDs of entries we already have to avoid duplicates
    const existingEntryIds = new Set(sameSiteRosEntries.map((entry) => entry.id));

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

    // Filter out duplicates from editedEntries
    const uniqueEditedEntries = editedEntries.filter((entry) => !existingEntryIds.has(entry.id));

    let rosEntries = sameSiteRosEntries;
    if (uniqueEditedEntries.length > 0) {
      rosEntries = rosEntries.concat(uniqueEditedEntries);
      rosEntries.sort((a, b) => a.participant_id - b.participant_id);
    }

    // Process each entry to get ROS completion status individually
    const enhancedEntries = await Promise.all(
      rosEntries.map(async (entry) => {
        // Get ROS completion status for this specific participant
        const rosCompletionStatus = await dbClient.db[collections.PARTICIPANTS_STATUS].findOne(
          {
            participant_id: entry.participant_id,
            status: 'archived',
            'data.type': 'rosComplete',
            'data.confirmed': 'true',
            current: true,
          },
          {
            order: [{ field: 'id', direction: 'desc' }], // Get the most recent one
          }
        );

        const rosCompleted = rosCompletionStatus ? 'TRUE' : 'FALSE';
        const remainingInSectorOrRoleOrAnother =
          rosCompletionStatus?.data?.remainingInSectorOrRoleOrAnother || 'Unknown';

        return {
          ...entry,
          rosCompleted,
          remainingInSectorOrRoleOrAnother,
        };
      })
    );

    return mapRosEntries(enhancedEntries);
  } catch (error) {
    logger.error(
      `Error generating HA ROS milestones report for region ${region}: ${error.message}`
    );
    throw error;
  }
};
