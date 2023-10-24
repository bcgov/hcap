import {
  ProgramFilter,
  RegionsFilteredParticipantsFinder,
} from './RegionsFilteredParticipantsFinder';
import { HcapUserInfo } from '../../keycloak';
import { MHAW_ENABLED_REGIONS, Program } from '../../constants';

const getProgramFilterByUser = (user: HcapUserInfo, filter: ProgramFilter) => {
  if (user.isSuperUser || user.isMoH) {
    return filter;
  }
  if (user.isEmployer) {
    return Program.HCA;
  }
  // MHAW program isn't open yet to other regions
  const regionAllowedForMHAW = MHAW_ENABLED_REGIONS.some((region) => user?.roles.includes(region));
  if (user.isHA) {
    return regionAllowedForMHAW ? filter : Program.HCA;
  }
  if (user.isMHSUEmployer) {
    return regionAllowedForMHAW ? Program.MHAW : 'none';
  }
  return 'none';
};

export class ProgramFilteredParticipantsFinder {
  context;

  constructor(context) {
    this.context = context;
  }

  // filter by program based on user role
  filterProgram(programFilter) {
    const { user } = this.context;

    const filter = getProgramFilterByUser(user, programFilter);
    this.context.criteria = {
      ...this.context.criteria,
      ...(filter && { 'body.program =': `${filter}` }),
    };

    return new RegionsFilteredParticipantsFinder(this.context);
  }
}
