export const YesNo = [
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
];

export const YesNoPreferNot = [
  ...YesNo,
  { value: 'Prefer not to answer', label: 'Prefer not to answer' },
];

export const YesNoDontKnow = [...YesNo, { value: `I don't know`, label: `I don't know` }];
