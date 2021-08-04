const { dbClient, collections } = require('../db');
const { validate, CreatePSISchema } = require('../validation');

const getPSIs = async () => dbClient.db[collections.POST_SECONDARY_INSTITUTIONS].find();

const getPSI = async (id) =>
  dbClient.db[collections.POST_SECONDARY_INSTITUTIONS].find({
    id,
  });

const makePSI = async (psi) => {
  await validate(CreatePSISchema, psi);
  const data = {
    institute_name: psi.instituteName,
    health_authority: psi.healthAuthority,
    postal_code: psi.postalCode,
    street_address: psi.streetAddress || '',
    city: psi.city || '',
  };

  try {
    const newPSI = await dbClient.db[collections.POST_SECONDARY_INSTITUTIONS].insert(data);
    return newPSI;
  } catch (error) {
    if (error.code === '23505') {
      return { error: 'Duplicate Name for PSI', status: '400', code: '23505' };
    }
    throw error;
  }
};

module.exports = {
  getPSIs,
  getPSI,
  makePSI,
};
