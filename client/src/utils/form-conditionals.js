export const isOtherSelected = (selectedOption) => {
  return selectedOption === 'Other, please specify:';
};

export const showRoleInvolvesMentalHealthOrSubstanceUse = (isMHAWProgram, selectedOption) => {
  return (
    isMHAWProgram &&
    (selectedOption === 'Health care and social assistance' ||
      selectedOption === 'Continuing Care and Community Health Care' ||
      selectedOption === 'Community Social Services')
  );
};

// check for valid selections to prevent conditional values being sent back when conditions aren't truthy
export const checkForFieldResets = (
  selectedValue,
  fieldToUpdate,
  fieldValueCheck,
  setFieldValue,
  setFieldTouched
) => {
  if (selectedValue !== fieldValueCheck) {
    setFieldValue(fieldToUpdate, '');
    setFieldTouched && setFieldTouched(fieldToUpdate, false);
  }
};
