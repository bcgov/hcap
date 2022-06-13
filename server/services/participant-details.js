const { dbClient, collections } = require('../db');

const participantDetails = async (id) => {
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

    const { body: rosSiteDetails } = rosStatusDbObj?.rosSite || { body: {} };
    return {
      ...participant,
      rosStatus: {
        ...rosStatusDbObj,
        ...(rosStatusDbObj && {
          rosSite: {
            siteName: rosSiteDetails.siteName,
            siteId: rosSiteDetails.siteId,
            healthAuthority: rosSiteDetails.healthAuthority,
            id: rosSiteDetails.id,
          },
        }),
      },
    };
  }
  return participant;
};

module.exports = {
  participantDetails,
};
