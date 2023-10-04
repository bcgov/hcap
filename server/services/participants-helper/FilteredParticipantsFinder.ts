import { Pagination, run } from './core';
import { PaginatedParticipantsFinder } from './PaginatedParticipantsFinder';
import type { RunContext } from './core';
import { isPrivateEmployerOrMHSUEmployerOrHA } from './check-valid-role';

export class FilteredParticipantsFinder {
  context: RunContext & { rosStatuses };

  constructor(context) {
    this.context = context;
  }

  paginate(pagination: Pagination, sortField?: string) {
    const { user, employerSpecificJoin, siteDistanceJoin, siteIdDistance, rosStatuses } =
      this.context;
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

      if (sortField === 'distance' && siteIdDistance) {
        joinFieldName = `${siteDistanceJoin}.distance`;
      }

      if (sortField === 'rosStartDate') {
        joinFieldName = `${rosStatuses}.data.date`;
      }

      if (sortField === 'rosSiteName') {
        joinFieldName = `rosSite.body.siteName`;
      }

      if (sortField === 'lastEngagedDate') {
        joinFieldName = `${employerSpecificJoin}.created_at`;
      }

      // If a field to sort is provided we put that as first priority
      this.context.options.order.unshift({
        field: joinFieldName,
        direction: pagination.direction || 'asc',
      });

      // To manage employer name column sorting we need to sort by employer name
      if (sortField === 'employerName' || sortField === 'lastEngagedBy') {
        this.context.options.order.unshift(
          {
            field: `employerInfo.body.userInfo.firstName`,
            direction: pagination.direction || 'asc',
          },
          {
            field: `employerInfo.body.userInfo.lastName`,
            direction: pagination.direction || 'asc',
          }
        );
      }

      if (sortField === 'siteName') {
        this.context.options.order.unshift({
          field: `employerSite.body.siteName`,
          direction: pagination.direction || 'asc',
        });
      }

      if (sortField === 'status') {
        if (isPrivateEmployerOrMHSUEmployerOrHA(user)) {
          this.context.options.order.unshift({
            field: `${employerSpecificJoin}.status`,
            direction: pagination.direction || 'asc',
          });
        } else {
          this.context.options.order.unshift({
            field: 'status_infos',
            direction: pagination.direction || 'asc',
          });
        }
      }
    }

    return new PaginatedParticipantsFinder(this.context);
  }

  async run() {
    return run(this.context);
  }
}
