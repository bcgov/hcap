import React, { useEffect } from 'react';
import { Field, useField, useFormikContext } from 'formik';
import { RenderTextField, RenderSelectField, RenderRadioGroup } from '../fields';
import { formatOptions } from '../../utils';
import { YesNo, currentOrMostRecentIndustryOptions } from '../../constants';
import { showRoleInvolvesMentalHealthOrSubstanceUse, isOtherSelected } from '../../utils';

// need child component within Formik to get access to setValue props
export const BackgroundInformationForm = ({ isMHAWProgram, selectedOption }) => {
  const [industry, , industryHelpers] = useField('currentOrMostRecentIndustry');
  const [other, , otherHelpers] = useField('otherIndustry');
  const [, , involvesMentalHealthHelpers] = useField('roleInvolvesMentalHealthOrSubstanceUse');
  const { handleChange } = useFormikContext();

  useEffect(() => {
    // this is for helping to keep other selection and current industry a single value
    if (
      !other.value &&
      industry.value &&
      !currentOrMostRecentIndustryOptions.includes(industry.value)
    ) {
      const otherValue = industry.value;
      industryHelpers.setValue('Other, please specify:');
      otherHelpers.setValue(otherValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industry, other]);

  return (
    <>
      <Field
        name='currentOrMostRecentIndustry'
        component={RenderRadioGroup}
        label='* What industry do they currently or most recently work in? Please select the most applicable option.'
        options={formatOptions(currentOrMostRecentIndustryOptions)}
        onChange={(e) => {
          // check for valid selections to prevent conditional values being sent back when conditions aren't truthy
          const selectedValue = e.target.value;
          // reset the value of otherIndustry if user changes currentOrMostRecentIndustry selection from Other
          if (selectedValue !== 'Other, please specify:') {
            otherHelpers.setValue('');
            otherHelpers.setTouched(false);
          }
          // reset the value of roleInvolvesMentalHealthOrSubstanceUse if user changes currentOrMostRecentIndustry selection
          // from a valid selection to show this question
          if (!showRoleInvolvesMentalHealthOrSubstanceUse(isMHAWProgram, selectedValue)) {
            involvesMentalHealthHelpers.setValue('');
            involvesMentalHealthHelpers.setTouched(false);
          }
          handleChange(e);
        }}
      />
      {isOtherSelected(selectedOption) && (
        <Field name='otherIndustry' component={RenderTextField} />
      )}
      {showRoleInvolvesMentalHealthOrSubstanceUse(isMHAWProgram, selectedOption) && (
        <Field
          name='roleInvolvesMentalHealthOrSubstanceUse'
          component={RenderSelectField}
          label='Does/did this role involve delivering mental health and/or substance use
                  services?'
          options={YesNo}
        />
      )}
    </>
  );
};
