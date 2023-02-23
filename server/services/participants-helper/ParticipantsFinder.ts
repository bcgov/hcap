import { collections } from '../../db';
import { userRegionQuery } from '../user';
import { RegionsFilteredParticipantsFinder } from './RegionsFilteredParticipantsFinder';

export class ParticipantsFinder {
  dbClient;
  user;
  table;
  employerSpecificJoin: string;
  orgSpecificJoin: string;
  hiredGlobalJoin: string;
  siteJoin: string;
  siteDistanceJoin: string;
  rosStatuses: string;
  criteria: { 'body.preferredLocation ilike': string } | { or: { and: { or }[] }[] };

  constructor(dbClient, user) {
    this.dbClient = dbClient;
    this.user = user;
    this.table = dbClient.db[collections.PARTICIPANTS];
    this.employerSpecificJoin = 'employerSpecificJoin';
    this.orgSpecificJoin = 'orgSpecificJoin';
    this.hiredGlobalJoin = 'hiredGlobalJoin';
    this.siteJoin = 'siteJoin';
    this.siteDistanceJoin = 'siteDistanceJoin';
    // MoH/SU users query a view with ros_infos column
    this.rosStatuses = user.isHA || user.isEmployer ? 'rosStatuses' : 'ros_infos[0]';
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
