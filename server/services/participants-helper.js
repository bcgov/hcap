/* eslint-disable max-classes-per-file */
const { collections } = require('../db');
const { userRegionQuery } = require('./user.js');

const decomposeParticipantStatus = (raw, joinNames) => raw.map((participant) => {
  const statusInfos = [];

  joinNames.forEach((joinName) => {
    if (!participant[joinName]) return;
    statusInfos.push(...participant[joinName].map((statusInfo) => ({
      createdAt: statusInfo.created_at,
      employerId: statusInfo.employer_id,
      ...statusInfo.data && Object.keys(statusInfo.data).length > 0 ? { data: statusInfo.data }
        : {},
      status: statusInfo.status,
    })));
  });

  return {
    ...participant.body,
    id: participant.id,
    statusInfos,
  };
});

const run = async (context) => {
  const {
    table, criteria, options, employerSpecificJoin, hiredGlobalJoin, currentStatusJoin,
  } = context;
  let participants = await table.find(criteria, options);
  participants = decomposeParticipantStatus(
    participants,
    [
      employerSpecificJoin,
      currentStatusJoin,
      hiredGlobalJoin,
    ],
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
    this.context.options = pagination && {
      // ID is the default sort column
      order: [{
        field: 'id',
        direction: pagination.direction || 'asc',
      }],
      /*
        Using limit/offset pagination may decrease performance in the Postgres instance,
        however this is the only way to sort columns that does not have a deterministic
        ordering such as firstName.
        See more details: https://massivejs.org/docs/options-objects#keyset-pagination
      */
      ...pagination.offset && { offset: pagination.offset },
      ...pagination.pageSize && { limit: pagination.pageSize },
    };

    if (sortField && sortField !== 'id' && this.context.options.order) {
      // If a field to sort is provided we put that as first priority
      this.context.options.order.unshift({
        field: sortField === 'status' && this.context.showStatus ? `${this.context.employerSpecificJoin}.status` : `body.${sortField}`,
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

  filterStatus(statusFilters) {
    const {
      user, showStatus, criteria, employerSpecificJoin, hiredGlobalJoin, currentStatusJoin,
    } = this.context;

    if (showStatus) {
      if (user.isMoH) {
        this.context.table = this.context.table.join({
          [hiredGlobalJoin]: {
            type: 'LEFT OUTER',
            relation: collections.PARTICIPANTS_STATUS,
            on: {
              participant_id: 'id',
              current: true,
              status: 'hired',
            },
          },
          [currentStatusJoin]: {
            type: 'LEFT OUTER',
            relation: collections.PARTICIPANTS_STATUS,
            on: {
              participant_id: 'id',
              current: true,
            },
          },
          [employerSpecificJoin]: {
            type: 'LEFT OUTER',
            relation: collections.PARTICIPANTS_STATUS,
            on: {
              participant_id: 'id',
              current: true,
              employer_id: user.id,
            },
          },
        });
      } else {
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
              status: 'hired',
            },
          },
        });
      }

      if (statusFilters) {
        const newStatusFilters = statusFilters.includes('open')
          /*
            if 'open' is found adds also null because no status
            means that the participant is open as well
          */
          ? [null, ...statusFilters]
          : statusFilters;

        const statusQuery = {
          or: newStatusFilters.filter((item) => item !== 'unavailable')
            .map((status) => ({ [`${employerSpecificJoin}.status`]: status })),
        };
        if (criteria.or) {
          criteria.or[0].and.push(statusQuery);
        } else {
          criteria.or = [{ and: [statusQuery] }];
        }

        // we don't want hired participants listed with such statuses:
        if (statusFilters.some((item) => ['open', 'prospecting', 'interviewing', 'offer_made'].includes(item))) {
          criteria.or[0].and.push({ [`${hiredGlobalJoin}.status`]: null });
        }

        /*
          the higher level 'unavailable' status filter covers participants with
          'prospecting', 'interviewing', 'offer_made' statuses which have
          been hired by someone else
        */
        if (statusFilters.includes('unavailable')) {
          const unavailableQuery = {
            and: [{
              or: ['prospecting', 'interviewing', 'offer_made'].map((status) => ({ [`${employerSpecificJoin}.status`]: status })),
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
    }

    return new FilteredParticipantsFinder(this.context);
  }

  async paginate(pagination) {
    return new FilteredParticipantsFinder(this.context).paginate(pagination);
  }
}

class RegionsFilteredParticipantsFinder {
  constructor(context) {
    this.context = context;
  }

  filterParticipantFields({ postalCodeFsa, lastName, emailAddress }) {
    this.context.criteria = {
      ...this.context.criteria,
      ...postalCodeFsa && { 'body.postalCodeFsa ilike': `${postalCodeFsa}%` },
      ...lastName && { 'body.lastName ilike': `${lastName}%` },
      ...emailAddress && { 'body.emailAddress ilike': `${emailAddress}%` },
    };
    return new FieldsFilteredParticipantsFinder(this.context);
  }

  async paginate(pagination) {
    return new FilteredParticipantsFinder(this.context).paginate(pagination);
  }
}

class ParticipantsFinder {
  constructor(dbClient, user) {
    this.user = user;
    this.table = dbClient.db[collections.PARTICIPANTS];
    this.showStatus = this.user.isHA || this.user.isEmployer || this.user.isMoH;
    this.employerSpecificJoin = 'employerSpecificJoin';
    this.hiredGlobalJoin = 'hiredGlobalJoin';
  }

  filterRegion(regionFilter) {
    this.criteria = this.user.isSuperUser || this.user.isMoH
      ? {
        ...regionFilter && { 'body.preferredLocation ilike': `%${regionFilter}%` },
      }
      : {
        ...(regionFilter && this.user.regions.includes(regionFilter))
          ? { 'body.preferredLocation ilike': `%${regionFilter}%` }
          /*
            as an employer/HA, the first inner AND array is used to filter regions
            and statuses (unless when the status is 'unavailable', in this case
            we handle in the upper OR array)
          */
          : { or: [{ and: [userRegionQuery(this.user.regions, 'body.preferredLocation')] }] },
        'body.interested': 'yes',
        'body.crcClear': 'yes',
      };
    return new RegionsFilteredParticipantsFinder(this);
  }
}

module.exports = { ParticipantsFinder };
