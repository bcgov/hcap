import { RegionsFilteredParticipantsFinder } from './RegionsFilteredParticipantsFinder';

const HCA = 'HCA';
const MHAW = 'MHAW';

export class ProgramFilteredParticipantsFinder {
  context;

  constructor(context) {
    this.context = context;
  }

  // filter by program based on user role
  filterProgram(programFilter) {
    const { user } = this.context;

    if (user.isSuperUser || user.isMoH || user.isHA) {
      this.context.criteria = {
        ...this.context.criteria,
        ...(programFilter && { 'body.program =': `${programFilter}` }),
      };
    } else if (user.isEmployer) {
      this.context.criteria = { ...this.context.criteria, ...{ 'body.program =': `${HCA}` } };
    } else if (user.isMHSUEmployer) {
      this.context.criteria = { ...this.context.criteria, ...{ 'body.program =': `${MHAW}` } };
    }

    return new RegionsFilteredParticipantsFinder(this.context);
  }
}
