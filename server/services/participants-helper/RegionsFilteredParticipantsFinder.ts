import { FieldsFilteredParticipantsFinder } from './FieldsFilteredParticipantsFinder';
import { FilteredParticipantsFinder } from './FilteredParticipantsFinder';

export class RegionsFilteredParticipantsFinder {
  context;

  constructor(context) {
    this.context = context;
  }

  filterParticipantFields({
    postalCodeFsa,
    lastName,
    emailAddress,
    interestFilter,
    isIndigenousFilter,
  }) {
    this.context.criteria = {
      ...this.context.criteria,
      ...(postalCodeFsa && { 'body.postalCodeFsa ilike': `${postalCodeFsa}%` }),
      ...(lastName && { 'body.lastName ilike': `${lastName}%` }),
      ...(emailAddress && { 'body.emailAddress ilike': `${emailAddress}%` }),
      ...(interestFilter && { 'body.interested <>': ['no', 'withdrawn'] }),
      ...(isIndigenousFilter && { 'body.isIndigenous =': true }),
    };
    return new FieldsFilteredParticipantsFinder(this.context);
  }

  async paginate(pagination) {
    return new FilteredParticipantsFinder(this.context).paginate(pagination);
  }
}
