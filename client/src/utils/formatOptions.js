/**
 * Formats for RenderSelectField
 * @param {[string]} optionList
 * @returns {[{value: string, label: string},...]}
 */
export const formatOptions = (optionList) => {
  return optionList.map((option) => ({ value: option, label: option }));
};
