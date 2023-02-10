const express = require('express');
const keycloak = require('../keycloak');
const logger = require('../logger.js');
const { asyncMiddleware } = require('../error-handler.js');
const { CreateAllocationSchema } = require('../validation');
const { expressRequestBodyValidator } = require('../middleware');
const { createPhaseAllocation, updatePhaseAllocation } = require('../services/phase');
const { FEATURE_PHASE_ALLOCATION } = require('../services/feature-flags');

const router = express.Router();

// Create phase allocation: POST
router.post(
  '/',
  [
    keycloak.allowRolesMiddleware('ministry_of_health'),
    keycloak.getUserInfoMiddleware(),
    // expressRequestBodyValidator(CreateAllocationSchema),
  ],
  asyncMiddleware(async (req, resp) => {
    if (!FEATURE_PHASE_ALLOCATION) {
      return resp.status(501).send('Phase allocation feature not active');
    }
    if (req.body.site_id) {
      // check if site_phasE_allocation exists for site_id and phase_id, if not create one.
    }
    try {
      const { body, hcapUserInfo: user } = req;
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
      return resp.status(400).send(`${err}`);
    }
  })
);

// Update phase allocation: PATCH
router.patch(
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
        action: 'phase-allocation_post',
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
      return resp.status(400).send(`${err}`);
    }
  })
);

module.exports = router;
