const { dbClient, collections } = require('../db');
const { validate, CreatePSISchema } = require('../validation');

// Helpers

/**
 *
 * @param {*} psi object data transfer object from client
 * @returns object { success: boolean, message: string, status: string }
 */
const mapToDbModel = (psi) => ({
  institute_name: psi.instituteName,
  health_authority: psi.healthAuthority,
  postal_code: psi.postalCode,
  street_address: psi.streetAddress || '',
  city: psi.city || '',
});

const getPSIs = async () => dbClient.db[collections.POST_SECONDARY_INSTITUTIONS].find();

const getAllPSIWithCohorts = async () => {
  const results = await dbClient.db[collections.POST_SECONDARY_INSTITUTIONS]
    .join({
      cohorts: {
        relation: collections.COHORTS,
        type: 'LEFT OUTER',
        on: {
          psi_id: 'id',
        },
        participantsCohorts: {
          relation: collections.COHORT_PARTICIPANTS,
          type: 'LEFT OUTER',
          on: {
            cohort_id: `${collections.COHORTS}.id`,
          },
        },
      },
    })
    .find(
      {},
      {
        order: [{ field: 'institute_name', direction: 'asc' }],
      }
    );
  return results;
};

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
      return { error: 'Duplicate Name for PSI', status: 409, code: '23505' };
    }
    throw error;
  }
};

const updatePSI = async (id, update) => {
  // Check PSI is available or not
  const [psi] = await getPSI(id);
  if (!psi) {
    return { success: false, message: 'PSI not found', status: 404 };
  }

  // Now verify the new psi name should be unique
  const { instituteName } = update;
  if (!instituteName) {
    return { success: false, message: 'PSI name is required', status: 400 };
  }
  if (instituteName !== psi.institute_name) {
    const existingPSI = await dbClient.db[collections.POST_SECONDARY_INSTITUTIONS].findOne({
      institute_name: instituteName,
    });
    if (existingPSI) {
      return { success: false, message: 'PSI name already exists', status: 409 };
    }
  }

  // Now update
  const [updatedPSI] = await dbClient.db[collections.POST_SECONDARY_INSTITUTIONS].update(
    { id },
    {
      ...mapToDbModel(update),
    }
  );

  return { success: true, message: 'PSI updated successfully', status: 200, psi: updatedPSI };
};

module.exports = {
  getPSIs,
  getPSI,
  makePSI,
  updatePSI,
  getAllPSIWithCohorts,
};
