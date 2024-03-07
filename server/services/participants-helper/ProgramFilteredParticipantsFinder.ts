import {
  ProgramFilter,
  RegionsFilteredParticipantsFinder,
} from './RegionsFilteredParticipantsFinder';
import { HcapUserInfo } from '../../keycloak';
import { Program } from '../../constants';

const getProgramFilterByUser = (user: HcapUserInfo, filter: ProgramFilter) => {
  if (user.isSuperUser || user.isMoH || user.isHA) {
    return filter;
  }
  if (user.isEmployer) {
    return Program.HCA;
  }

  if (user.isMHSUEmployer) {
    return Program.MHAW;
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
