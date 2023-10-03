const knownFields = [
  'educationalRequirements',
  'indigenous',
  'driverLicense',
  'experienceWithMentalHealthOrSubstanceUse',
  'currentOrMostRecentIndustry',
  'roleInvolvesMentalHealthOrSubstanceUse',
];

exports.up = async (pgm) => {
  await pgm.db.query(`
    UPDATE participants SET 
    body = body || '{"program": "HCA", ${knownFields.map((f) => `"${f}": "Unknown"`).join(', ')}}';
  `);
};

exports.down = async (pgm) => {
  await pgm.db.query(`
    UPDATE participants SET 
    body = body #- '{program}' #- ${knownFields.map((f) => `'{${f}}'`).join(' #- ')};
  `);
};
