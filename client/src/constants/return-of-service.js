export const rosPositionType = {
  casual: {
    value: 'casual',
    label: 'Casual',
  },
  permanent: {
    value: 'permanent',
    label: 'Permanent',
  },
};

export const rosPositionTypeValues = Object.values(rosPositionType).map(({ value }) => value);

export const rosEmploymentType = {
  fullTime: {
    value: 'full-time',
    label: 'Full Time',
  },
  partTime: {
    value: 'part-time',
    label: 'Part Time',
  },
};

export const rosEmploymentTypeValues = Object.values(rosEmploymentType).map(({ value }) => value);

export const rosMaxStartDate = '2100-01-01'; // first future date that is *invalid*
