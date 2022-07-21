export const healthAuthorities = [
  { value: 'Interior', label: 'Interior Health' },
  { value: 'Fraser', label: 'Fraser Health' },
  { value: 'Vancouver Coastal', label: 'Vancouver Coastal Health' },
  { value: 'Vancouver Island', label: 'Vancouver Island Health' },
  { value: 'Northern', label: 'Northern Health' },
];

export const healthAuthoritiesFilter = healthAuthorities.map((ha) => ha.value).concat('None');
