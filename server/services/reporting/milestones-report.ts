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
        participantStatusJoin: {
          type: 'LEFT OUTER',
          decomposeTo: 'object',
          relation: collections.PARTICIPANTS_STATUS,
          on: {
            participant_id: 'participant_id',
            current: true,
            'data.site': 'siteJoin.body.siteId',
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

    // Get the ROS completion status for each participant
    const participantIds = entries.map((entry) => entry.participant_id);

    // If no participants found, return empty array
    if (participantIds.length === 0) {
      logger.info('No participants found for ROS milestone report');
      return [];
    }

    const rosCompletionStatuses = await dbClient.db[collections.PARTICIPANTS_STATUS].find({
      participant_id: { $in: participantIds },
      status: 'archived',
      'data.type': 'rosComplete',
      'data.confirmed': 'true',
      current: true,
    });

    // Create a map of participant IDs to their ROS completion status
    const rosCompletionMap = new Map();
    rosCompletionStatuses.forEach((status) => {
      rosCompletionMap.set(status.participant_id, {
        completed: true,
        remainingInSectorOrRoleOrAnother:
          status.data?.remainingInSectorOrRoleOrAnother || 'Unknown',
      });
    });

    // Enhance the entries with the ROS completion information
    const enhancedEntries = entries.map((entry) => {
      const rosCompletion = rosCompletionMap.get(entry.participant_id) || {
        completed: false,
        remainingInSectorOrRoleOrAnother: 'Unknown',
      };

      return {
        ...entry,
        rosCompleted: rosCompletion.completed ? 'TRUE' : 'FALSE',
        remainingInSectorOrRoleOrAnother: rosCompletion.remainingInSectorOrRoleOrAnother,
      };
    });

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
        participantStatusJoin: {
          type: 'LEFT OUTER',
          decomposeTo: 'object',
          relation: collections.PARTICIPANTS_STATUS,
          on: {
            participant_id: 'participant_id',
            current: true,
            'data.site': 'siteJoin.body.siteId',
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

    // If no participants found in the region, return empty array
    if (sameSiteRosEntries.length === 0) {
      logger.info(`No participants found for ROS milestone report in region: ${region}`);
      return [];
    }

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
        participantStatusJoin: {
          type: 'LEFT OUTER',
          decomposeTo: 'object',
          relation: collections.PARTICIPANTS_STATUS,
          on: {
            participant_id: 'participant_id',
            current: true,
            'data.site': 'siteJoin.body.siteId',
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

    // Get all participant IDs from the combined entries
    const participantIds = rosEntries.map((entry) => entry.participant_id);

    // Get ROS completion statuses for these participants
    const rosCompletionStatuses = await dbClient.db[collections.PARTICIPANTS_STATUS].find({
      participant_id: { $in: participantIds },
      status: 'archived',
      'data.type': 'rosComplete',
      'data.confirmed': 'true',
      current: true,
    });

    // Create a map of participant IDs to their ROS completion status
    const rosCompletionMap = new Map();
    rosCompletionStatuses.forEach((status) => {
      rosCompletionMap.set(status.participant_id, {
        completed: true,
        remainingInSectorOrRoleOrAnother:
          status.data?.remainingInSectorOrRoleOrAnother || 'Unknown',
      });
    });

    // Enhance the entries with the ROS completion information
    const enhancedEntries = rosEntries.map((entry) => {
      const rosCompletion = rosCompletionMap.get(entry.participant_id) || {
        completed: false,
        remainingInSectorOrRoleOrAnother: 'Unknown',
      };

      return {
        ...entry,
        rosCompleted: rosCompletion.completed ? 'TRUE' : 'FALSE',
        remainingInSectorOrRoleOrAnother: rosCompletion.remainingInSectorOrRoleOrAnother,
      };
    });

    return mapRosEntries(enhancedEntries);
  } catch (error) {
    logger.error(
      `Error generating HA ROS milestones report for region ${region}: ${error.message}`
    );
    throw error;
  }
};
