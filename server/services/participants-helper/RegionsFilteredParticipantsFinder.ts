import { FieldsFilteredParticipantsFinder } from './FieldsFilteredParticipantsFinder';
import { FilteredParticipantsFinder } from './FilteredParticipantsFinder';

export type PostalCodeFsaFilter = { 'body.postalCodeFsa ilike': string };
export type LastNameFilter = { 'body.lastName ilike': string };
export type EmailAddressFilter = { 'body.emailAddress ilike': string };
export type InterestFilter = { 'body.interested <>': string[] } | string[];
export type IsIndigenousFilter = { 'body.isIndigenous =': boolean };
export type idFilter = { 'id =': string };
export type ProgramFilter = { 'body.program =': string };
export type LivedLivingExperienceFilter = {
  'body.experienceWithMentalHealthOrSubstanceUse =': string;
};
export type WithdrawnParticipantsFilter = {
  'body.interested <>': string;
};

export class RegionsFilteredParticipantsFinder {
  context;

  constructor(context) {
    this.context = context;
  }

  filterParticipantFields({
    id,
    postalCodeFsa,
    lastName,
    emailAddress,
    interestFilter,
    isIndigenousFilter,
    livedLivingExperienceFilter,
    withdrawnParticipantsFilter,
  }: {
    id?: idFilter;
    postalCodeFsa?: PostalCodeFsaFilter;
    lastName?: LastNameFilter;
    emailAddress?: EmailAddressFilter;
    interestFilter?: InterestFilter;
    isIndigenousFilter?: IsIndigenousFilter;
    livedLivingExperienceFilter?: LivedLivingExperienceFilter;
    withdrawnParticipantsFilter?: WithdrawnParticipantsFilter;
  }) {
    this.context.criteria = {
      ...this.context.criteria,
      ...(id && { 'id =': id }),
      ...(postalCodeFsa && { 'body.postalCodeFsa ilike': `${postalCodeFsa}%` }),
      ...(lastName && { 'body.lastName ilike': `${lastName}%` }),
      ...(emailAddress && { 'body.emailAddress ilike': `${emailAddress}%` }),
      ...(interestFilter && { 'body.interested <>': ['no', 'withdrawn'] }),
      ...(isIndigenousFilter && {
        and: [
          ...(this.context.criteria.and ?? []),
          {
            or: [{ 'body.isIndigenous =': true }, { 'body.indigenous =': 'Yes' }],
          },
        ],
      }),
      ...(livedLivingExperienceFilter && {
        'body.experienceWithMentalHealthOrSubstanceUse =': 'Yes',
      }),
      ...(withdrawnParticipantsFilter && {
        'body.interested <>': 'withdrawn',
      }),
    };

    return new FieldsFilteredParticipantsFinder(this.context);
  }

  async paginate(pagination) {
    return new FilteredParticipantsFinder(this.context).paginate(pagination);
  }
}
