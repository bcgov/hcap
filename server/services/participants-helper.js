/* eslint-disable max-classes-per-file */
const { collections, views } = require('../db');
const { userRegionQuery } = require('./user.js');

const participantStatus = {
  OPEN: 'open',
  PROSPECTING: 'prospecting',
  INTERVIEWING: 'interviewing',
  OFFER_MADE: 'offer_made',
  ARCHIVED: 'archived',
  REJECTED: 'rejected',
  HIRED: 'hired',
};

const scrubParticipantData = (raw, joinNames) =>
  raw.map((participant) => {
    const statusInfos = [];

    const decomposeStatusInfo = (statusInfo) => ({
      createdAt: statusInfo.created_at,
      employerId: statusInfo.employer_id,
      ...(statusInfo.data && Object.keys(statusInfo.data).length > 0
        ? { data: statusInfo.data }
        : {}),
      status: statusInfo.status,
    });

    if (joinNames) {
      joinNames.forEach((joinName) => {
        if (!participant[joinName]) return;
        statusInfos.push(...participant[joinName].map(decomposeStatusInfo));
      });
    } else {
      participant.status_infos?.forEach((statusInfo) => {
        statusInfos.push(decomposeStatusInfo(statusInfo));
      });
    }

    return {
      ...participant.body,
      id: participant.id,
      statusInfos,
    };
  });

const addSiteNameToStatusData = (raw, employerSpecificJoin, siteJoin) =>
  raw.map((participant) => ({
    ...participant,
    [employerSpecificJoin]: participant[employerSpecificJoin]?.map((item) => ({
      ...item,
      data: {
        ...item.data,
        siteName: participant[siteJoin]?.find((site) => site.siteId === item.site)?.body.siteName,
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

// Find the previous status for each org, create a copy of it
const revertToOldStatus = async (participantStatuses, setParticipantStatus) => {
  await participantStatuses.forEach(async (status) => {
    if (status?.data?.previousStatus !== participantStatus.ARCHIVED) {
      await setParticipantStatus(
        status.employer_id,
        status.participant_id,
        status.data.previousStatus,
        {
          ...(status.data?.previousData || {}),
        }
      );
    }
  });
};
// Withdraw the participant
const insertWithdrawalParticipantStatus = async (participantStatuses, setParticipantStatus) => {
  participantStatuses.forEach(async (status) => {
    // Prevent locking the user into a loop of archived statuses
    if (!(status.status && status.status === participantStatus.ARCHIVED)) {
      await setParticipantStatus(
        status.employer_id,
        status.participant_id,
        participantStatus.ARCHIVED,
        {
          final_status: 'Withdrawn from HCAP',
          previousStatus: status.status,
          previousData: status.data,
        }
      );
    }
  });
};

const run = async (context) => {
  const {
    table,
    criteria,
    options,
    user,
    employerSpecificJoin,
    hiredGlobalJoin,
    siteDistanceJoin,
    siteJoin,
  } = context;
  let participants = await table.find(criteria, options);
  participants = addSiteNameToStatusData(participants, employerSpecificJoin, siteJoin);
  participants = addDistanceToParticipantFields(participants, siteDistanceJoin);
  participants = scrubParticipantData(
    participants,
    (user.isEmployer || user.isHA) && [employerSpecificJoin, hiredGlobalJoin]
  );
  return participants;
};

class PaginatedParticipantsFinder {
  constructor(context) {
    this.context = context;
  }

  async run() {
    return run(this.context);
  }
}

class FilteredParticipantsFinder {
  constructor(context) {
    this.context = context;
  }

  paginate(pagination, sortField) {
    const { user, employerSpecificJoin, siteJoin, siteDistanceJoin, siteIdDistance } = this.context;
    this.context.options = pagination && {
      // ID is the default sort column
      order: [
        {
          field: 'id',
          direction: pagination.direction || 'asc',
          nulls: 'last', // Relevant for sorting by ascending distance
        },
      ],
      //  Using limit/offset pagination may decrease performance in the Postgres instance,
      //  however this is the only way to sort columns that does not have a deterministic
      //  ordering such as firstName.
      //  See more details: https://massivejs.org/docs/options-objects#keyset-pagination
      ...(pagination.offset && { offset: pagination.offset }),
      ...(pagination.pageSize && { limit: pagination.pageSize }),
    };

    if (sortField && sortField !== 'id' && this.context.options.order) {
      let joinFieldName = `body.${sortField}`;

      if (sortField === 'status') {
        joinFieldName =
          user.isEmployer || user.isHA ? `${employerSpecificJoin}.status` : 'status_infos';
      }

      if (sortField === 'distance' && siteIdDistance) {
        joinFieldName = `${siteDistanceJoin}.distance`;
      }

      if (sortField === 'siteName') {
        joinFieldName = `${siteJoin}.body.${sortField}`;
      }

      // If a field to sort is provided we put that as first priority
      this.context.options.order.unshift({
        field: joinFieldName,
        direction: pagination.direction || 'asc',
      });
    }

    return new PaginatedParticipantsFinder(this.context);
  }

  async run() {
    return run(this.context);
  }
}

class FieldsFilteredParticipantsFinder {
  constructor(context) {
    this.context = context;
  }

  filterExternalFields({ statusFilters, siteIdDistance }) {
    const { user, criteria, employerSpecificJoin, hiredGlobalJoin, siteJoin, siteDistanceJoin } =
      this.context;
    this.context.siteIdDistance = siteIdDistance;

    if (user.isEmployer || user.isHA) {
      this.context.table = this.context.table.join({
        [employerSpecificJoin]: {
          type: 'LEFT OUTER',
          relation: collections.PARTICIPANTS_STATUS,
          on: {
            participant_id: 'id',
            current: true,
            employer_id: user.id,
          },
        },
        [hiredGlobalJoin]: {
          type: 'LEFT OUTER',
          relation: collections.PARTICIPANTS_STATUS,
          on: {
            participant_id: 'id',
            current: true,
            status: participantStatus.HIRED,
          },
        },
        ...(siteIdDistance && {
          [siteDistanceJoin]: {
            type: 'LEFT OUTER',
            relation: collections.PARTICIPANTS_DISTANCE,
            on: {
              participant_id: 'id',
              site_id: siteIdDistance,
            },
          },
        }),
        ...(statusFilters.includes('hired') && {
          [siteJoin]: {
            type: 'LEFT OUTER',
            relation: collections.EMPLOYER_SITES,
            on: {
              'body.siteId': `${hiredGlobalJoin}.data.site`,
            },
          },
        }),
      });

      if (statusFilters) {
        const newStatusFilters = statusFilters.includes('open')
          ? //  if 'open' is found adds also null because no status
            //  means that the participant is open as well
            [null, ...statusFilters]
          : statusFilters;

        const statusQuery = {
          or: newStatusFilters
            .filter((item) => item !== 'unavailable')
            .map((status) => ({ [`${employerSpecificJoin}.status`]: status })),
        };
        if (criteria.or) {
          criteria.or[0].and.push(statusQuery);
        } else {
          criteria.or = [{ and: [statusQuery] }];
        }

        // we don't want hired participants listed with such statuses:
        if (
          statusFilters.some((item) =>
            [
              participantStatus.OPEN,
              participantStatus.PROSPECTING,
              participantStatus.INTERVIEWING,
              participantStatus.OFFER_MADE,
            ].includes(item)
          )
        ) {
          criteria.or[0].and.push({ [`${hiredGlobalJoin}.status`]: null });
        }

        //  the higher level 'unavailable' status filter covers participants with
        //  'prospecting', 'interviewing', 'offer_made' statuses which have
        //  been hired by someone else
        if (statusFilters.includes('unavailable')) {
          const unavailableQuery = {
            and: [
              {
                or: ['prospecting', 'interviewing', 'offer_made'].map((status) => ({
                  [`${employerSpecificJoin}.status`]: status,
                })),
              },
              { [`${hiredGlobalJoin}.status`]: 'hired' },
            ],
          };

          if (criteria.or) {
            criteria.or.push(unavailableQuery);
          } else {
            criteria.or = [unavailableQuery];
          }
        }
      }
    } else {
      // PARTICIPANTS_STATUS_INFOS is a view with a join that
      // brings all current statuses of each participant
      this.context.table = this.context.dbClient.db[views.PARTICIPANTS_STATUS_INFOS];

      if (statusFilters) {
        const statuses = statusFilters.includes('open')
          ? [null, ...statusFilters]
          : statusFilters || [];
        this.context.criteria = {
          ...this.context.criteria,
          or: statuses.map((status) =>
            status
              ? {
                  'status_infos::text ilike': `%{%"status": "${status}"%}%`,
                }
              : { status_infos: null }
          ),
        };
      }
    }
    return new FilteredParticipantsFinder(this.context);
  }
}

class RegionsFilteredParticipantsFinder {
  constructor(context) {
    this.context = context;
  }

  filterParticipantFields({ postalCodeFsa, lastName, emailAddress, interestFilter }) {
    this.context.criteria = {
      ...this.context.criteria,
      ...(postalCodeFsa && { 'body.postalCodeFsa ilike': `${postalCodeFsa}%` }),
      ...(lastName && { 'body.lastName ilike': `${lastName}%` }),
      ...(emailAddress && { 'body.emailAddress ilike': `${emailAddress}%` }),
      ...(interestFilter && { 'body.interested <>': ['no', 'withdrawn'] }),
    };
    return new FieldsFilteredParticipantsFinder(this.context);
  }

  async paginate(pagination) {
    return new FilteredParticipantsFinder(this.context).paginate(pagination);
  }
}

class ParticipantsFinder {
  constructor(dbClient, user) {
    this.dbClient = dbClient;
    this.user = user;
    this.table = dbClient.db[collections.PARTICIPANTS];
    this.employerSpecificJoin = 'employerSpecificJoin';
    this.hiredGlobalJoin = 'hiredGlobalJoin';
    this.siteJoin = 'siteJoin';
    this.siteDistanceJoin = 'siteDistanceJoin';
  }

  filterRegion(regionFilter) {
    this.criteria =
      this.user.isSuperUser || this.user.isMoH
        ? {
            ...(regionFilter && { 'body.preferredLocation ilike': `%${regionFilter}%` }),
          }
        : {
            ...(regionFilter && this.user.regions.includes(regionFilter)
              ? { 'body.preferredLocation ilike': `%${regionFilter}%` }
              : //  as an employer/HA, the first inner AND array is used to filter regions
                //  and statuses (unless when the status is 'unavailable', in this case
                //  we handle in the upper OR array)
                { or: [{ and: [userRegionQuery(this.user.regions, 'body.preferredLocation')] }] }),
          };
    return new RegionsFilteredParticipantsFinder(this);
  }
}

module.exports = {
  ParticipantsFinder,
  revertToOldStatus,
  insertWithdrawalParticipantStatus,
};
