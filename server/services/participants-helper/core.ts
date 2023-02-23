import logger from '../../logger';

/**
 * @description Flattens the participants array into a single array based on statuses
 * @param {Array<any>} participants
 * @returns {Array<any>}
 */
const flattenParticipants = (participants) => {
  const flattenedParticipantList = [];
  participants.forEach((participant) => {
    const { employerSpecificJoin = [], ...participantInfo } = participant;
    // Single or No employerSpecific statuses
    if (employerSpecificJoin.length === 0 || employerSpecificJoin.length === 1) {
      flattenedParticipantList.push(participant);
    } else {
      employerSpecificJoin.forEach((status) => {
        flattenedParticipantList.push({
          ...participantInfo,
          employerSpecificJoin: [status],
        });
      });
    }
  });
  return flattenedParticipantList;
};

const scrubParticipantData = (raw, joinNames, sites) =>
  raw.map((participant) => {
    const statusInfos = [];
    let rosStatuses = participant.rosStatuses ?? [];

    const decomposeStatusInfo = (statusInfo) => ({
      id: statusInfo.id,
      createdAt: statusInfo.created_at,
      employerId: statusInfo.employer_id,
      ...(statusInfo.data && Object.keys(statusInfo.data).length > 0
        ? { data: statusInfo.data }
        : {}),
      status: statusInfo.status,
      employerInfo:
        statusInfo.employerInfo && statusInfo.employerInfo.body.userInfo
          ? {
              ...statusInfo.employerInfo.body?.userInfo,
              id: statusInfo.employerInfo.body.id,
            }
          : {},
    });

    if (joinNames) {
      joinNames.forEach((joinName) => {
        if (!participant[joinName]) return;
        statusInfos.push(...participant[joinName].map(decomposeStatusInfo));
      });
      // Use hiring site instead of ROS site to see if user has permissions. For HA / employers only
      const hiredAt = participant.hiredGlobalJoin?.[0];
      rosStatuses = sites.includes(hiredAt?.data.site) ? rosStatuses : [];
    } else {
      rosStatuses = participant.ros_infos ?? [];
      participant.status_infos?.forEach((statusInfo) => {
        statusInfos.push(decomposeStatusInfo(statusInfo));
      });
    }

    return {
      ...participant.body,
      id: participant.id,
      statusInfos,
      rosStatuses: rosStatuses.sort((ros1, ros2) => ros2.id - ros1.id),
    };
  });

const addSiteNameToStatusData = (raw, employerSpecificJoin) =>
  raw.map((participant) => ({
    ...participant,
    [employerSpecificJoin]: participant[employerSpecificJoin]?.map((item) => ({
      ...item,
      data: {
        ...item.data,
        siteName: item.employerSite?.body?.siteName,
      },
    })),
  }));

const addDistanceToParticipantFields = (raw, siteDistanceJoin) =>
  raw.map((participant) => ({
    ...participant,
    ...(participant[siteDistanceJoin] && {
      body: {
        ...participant.body,
        distance: participant[siteDistanceJoin][0]?.distance,
      },
    }),
  }));

export const run = async (context) => {
  const {
    table,
    criteria,
    options,
    user,
    employerSpecificJoin,
    hiredGlobalJoin,
    siteDistanceJoin,
  } = context;
  try {
    let participants = await table.find(criteria, options);
    participants = flattenParticipants(participants);
    participants = addSiteNameToStatusData(participants, employerSpecificJoin);
    participants = addDistanceToParticipantFields(participants, siteDistanceJoin);
    participants = scrubParticipantData(
      participants,
      (user.isEmployer || user.isHA) && [employerSpecificJoin, hiredGlobalJoin],
      (user.isEmployer || user.isHA) && (user.sites || [])
    );
    return participants;
  } catch (error) {
    if (['test', 'local', 'dev'].includes(process.env.APP_ENV)) {
      const sql = await table.find(criteria, { ...options, build: true });
      // Logging debugging info for dev/local/test environments
      logger.info('participant-helper:run: sql: ', sql);
      logger.info('participant-helper:run: criteria: ', criteria);
    }
    throw new Error(`participant-helper:run: ${error}`);
  }
};
