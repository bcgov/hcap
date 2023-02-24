import { FieldsFilteredParticipantsFinder } from './FieldsFilteredParticipantsFinder';
import { FilteredParticipantsFinder } from './FilteredParticipantsFinder';

export type PostalCodeFsaFilter = { 'body.postalCodeFsa ilike': string };
export type LastNameFilter = { 'body.lastName ilike': string };
export type EmailAddressFilter = { 'body.emailAddress ilike': string };
export type InterestFilter = { 'body.interested <>': string[] } | string[];
export type IsIndigenousFilter = { 'body.isIndigenous =': boolean };

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
  }: {
    postalCodeFsa?: PostalCodeFsaFilter;
    lastName?: LastNameFilter;
    emailAddress?: EmailAddressFilter;
    interestFilter?: InterestFilter;
    isIndigenousFilter?: IsIndigenousFilter;
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
