import { dbClient, collections } from '../db';
import { ParticipantStatus } from '../constants';
import type { HcapUserInfo } from '../keycloak';

const { HIRED, ARCHIVED } = ParticipantStatus;

// Verify user to view participant details
export const checkUserHasAccessToParticipant = async (id: number, user: HcapUserInfo) => {
  if (user.isMoH || user.isSuperUser) {
    return true;
  }

  if (user.isHA) {
    // Allow access for HA if participant is hired to HA's region

    // Get participant's hired status to retrieve hired site ID
    const hiredStatus = await dbClient.db[collections.PARTICIPANTS_STATUS].findOne({
      participant_id: id,
      status: HIRED,
    });

    // Get hired site to determine hired region
    const hiredSite = await dbClient.db[collections.EMPLOYER_SITES].findOne({
      'body.siteId': hiredStatus.data.site,
    });

    // Allow access if requesting user has access to hired site
    const participantIsInUserRegion = user.regions.includes(hiredSite.body.healthAuthority);

    return participantIsInUserRegion;
  }

  if (user.isEmployer) {
    // Allow access to employers if they are the person who hired or archived the user
    // or they have access to the site the participant was hired to
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

export const participantDetails = async (id: number) => {
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

    const latestStatuses = await dbClient.db[collections.PARTICIPANTS_STATUS]
      .join({
        site: {
          type: 'LEFT OUTER',
          relation: collections.EMPLOYER_SITES,
          decomposeTo: 'object',
          on: {
            'body.siteId': 'data.site',
          },
        },
      })
      .find({
        participant_id: id,
        current: true,
      });

    participant.latestStatuses = latestStatuses.map((status) => ({
      id: status.id,
      employerId: status.employer_id,
      siteId: status.data.site,
      status: status.status,
      siteName: status.site?.body.siteName,
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
