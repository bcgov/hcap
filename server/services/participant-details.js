const { dbClient, collections } = require('../db');
const { participantStatus } = require('../constants');

const { HIRED, ARCHIVED } = participantStatus;

// Verify user to view participant details
const checkUserHasAccessToParticipant = async (id, user) => {
  if (user.isMoH || user.isSuperUser) {
    return true;
  }
  // Get statuses connected with user
  if (user.isHA || user.isEmployer) {
    const statuses =
      (await dbClient.db[collections.PARTICIPANTS_STATUS].find({
        participant_id: id,
        current: true,
        'status IN': [HIRED, ARCHIVED],
        or: [
          {
            and: [
              {
                employer_id: user.id,
                'data.site': null,
              },
            ],
          },
          {
            'data.site IN': user.sites,
          },
        ],
      })) || [];

    return statuses.length > 0;
  }

  return false;
};

const participantDetails = async (id) => {
  // Verify user
  // Get participant object from database
  const [participant] =
    (await dbClient.db[collections.PARTICIPANTS].findDoc({
      id,
    })) || [];

  if (participant) {
    // Get RoS status
    const [rosStatusDbObj] = await dbClient.db[collections.ROS_STATUS]
      .join({
        rosSite: {
          type: 'LEFT OUTER',
          relation: collections.EMPLOYER_SITES,
          decomposeTo: 'object',
          on: {
            id: `${collections.ROS_STATUS}.site_id`,
          },
        },
      })
      .find({
        participant_id: id,
        is_current: true,
      });

    const latestStatuses = await dbClient.db[collections.PARTICIPANTS_STATUS].find({
      participant_id: id,
      current: true,
    });
    participant.latestStatuses = latestStatuses.map((status) => ({
      id: status.id,
      employerId: status.employer_id,
      siteId: status.data.site,
      status: status.status,
    }));

    const { body: rosSiteDetails } = rosStatusDbObj?.rosSite || { body: {} };
    return {
      ...participant,
      ...(rosStatusDbObj && {
        rosStatus: {
          ...rosStatusDbObj,
          rosSite: {
            siteName: rosSiteDetails.siteName,
            siteId: rosSiteDetails.siteId,
            healthAuthority: rosSiteDetails.healthAuthority,
            id: rosSiteDetails.id,
          },
        },
      }),
    };
  }
  return participant;
};

module.exports = {
  participantDetails,
  checkUserHasAccessToParticipant,
};
