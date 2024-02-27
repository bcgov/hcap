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
  setTouched
) => {
  if (selectedValue !== fieldValueCheck) {
    setFieldValue(fieldToUpdate, '');
    setTouched(false);
  }
};
