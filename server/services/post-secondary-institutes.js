const { dbClient, collections } = require('../db');

const getPSIs = async () => dbClient.db[collections.POST_SECONDARY_INSTITUTIONS].find();

const getPSI = async (id) =>
  dbClient.db[collections.POST_SECONDARY_INSTITUTIONS].find({
    id,
  });

const makePSI = async (psi) => {
  const data = {
    institute_name: psi.instituteName,
    health_authority: psi.healthAuthority,
    available_seats: psi.availableSeats,
    postal_code: psi.postalCode,
  };

  await dbClient.db[collections.POST_SECONDARY_INSTITUTIONS].insert(data);
};

module.exports = {
  getPSIs,
  getPSI,
  makePSI,
};
