const express = require('express');
const keycloak = require('../keycloak');
const logger = require('../logger.js');
const { asyncMiddleware } = require('../error-handler.js');
const { CreateAllocationSchema } = require('../validation');
const { expressRequestBodyValidator } = require('../middleware');
const {
  createPhaseAllocation,
  updatePhaseAllocation,
  getPhaseAllocation,
} = require('../services/allocations');
const { FEATURE_PHASE_ALLOCATION } = require('../services/feature-flags');

const router = express.Router();

// Create phase allocation: POST
router.post(
  '/',
  [
    keycloak.allowRolesMiddleware('ministry_of_health'),
    keycloak.getUserInfoMiddleware(),
    expressRequestBodyValidator(CreateAllocationSchema),
  ],
  asyncMiddleware(async (req, resp) => {
    if (!FEATURE_PHASE_ALLOCATION) {
      return resp.status(501).send('Phase allocation feature not active');
    }
    // check if site_phase_allocation exists for site_id and phase_id, if not create one.
    const { body, hcapUserInfo: user } = req;
    const allocation = await getPhaseAllocation(body.site_id, body.phase_id);
    if (allocation) {
      return resp.status(400).send('An allocation already exists.');
    }
    try {
      const response = await createPhaseAllocation(body, user);
      logger.info({
        action: 'allocation_post',
        performed_by: {
          username: user.username,
          id: user.id,
        },
        allocationId: response.id,
      });
      logger.info(response);
      return resp.status(201).json(response);
    } catch (err) {
      logger.error(err);
      return resp.status(400).send('Failed to set phase allocation');
    }
  })
);

// Update phase allocation: PUT
router.put(
  '/:id',
  [
    keycloak.allowRolesMiddleware('ministry_of_health'),
    keycloak.getUserInfoMiddleware(),
    expressRequestBodyValidator(CreateAllocationSchema),
  ],
  asyncMiddleware(async (req, resp) => {
    if (!FEATURE_PHASE_ALLOCATION) {
      return resp.status(501).send('Phase allocation feature not active');
    }
    try {
      const { body, hcapUserInfo: user } = req;
      const response = await updatePhaseAllocation(req.params.id, body, user);
      logger.info({
        action: 'allocation_put',
        performed_by: {
          username: user.username,
          id: user.id,
        },
        allocationId: response.id,
      });
      logger.info(response);
      return resp.status(201).json(response);
    } catch (err) {
      logger.error(err);
      return resp.status(400).send('Failed to update phase allocation');
    }
  })
);

module.exports = router;
