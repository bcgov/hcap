export const YesNo = [
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
];

export const YesNoPreferNot = [
  ...YesNo,
  { value: 'Prefer not to answer', label: 'Prefer not to answer' },
];

export const YesNoDontKnow = [...YesNo, { value: `I don't know`, label: `I don't know` }];

export const currentOrMostRecentIndustryOptions = [
  'Accommodation and food services',
  'Administrative and support, waste management and remediation services ',
  'Agriculture, forestry, fishing, and hunting',
  'Arts, entertainment, and recreation',
  'Community Social Services',
  'Construction',
  'Continuing Care and Community Health Care',
  'Educational services',
  'Finance and insurance',
  'Health care and social assistance',
  'Information and cultural industries',
  'Management of companies and enterprises',
  'Manufacturing',
  'Mining, quarrying, and oil and gas extraction',
  'Professional, scientific, and technical services',
  'Public administration',
  'Real estate and rental and leasing',
  'Retail trade',
  'Transportation and warehousing',
  'Tourism & Hospitality',
  'Utilities',
  'Wholesale trade',
  'None, not working previously',
  'Other, please specify:',
];

export const reasonForFindingOutOptions = [
  'Friend(s) or family',
  'WorkBC',
  'Government announcement',
  'Colleague(s)',
  'Job posting through Health Authority',
  'Job posting with employer',
  'Web search',
  'Social media',
  'Other',
];
