import express from 'express';
import keycloak from '../keycloak';
import logger from '../logger';
import { asyncMiddleware } from '../error-handler';
import { CreateAllocationSchema, UpdateAllocationSchema } from '../validation';
import { expressRequestBodyValidator } from '../middleware';
import { createAllocation, updateAllocation, getAllocation } from '../services/allocations';
import { FEATURE_PHASE_ALLOCATION } from '../services/feature-flags';

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
    const allocation = await getAllocation(body.site_id, body.phase_id);
    if (allocation) {
      return resp.status(400).send('An allocation already exists.');
    }
    try {
      const response = await createAllocation(body, user);
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

// Update phase allocation: PATCH
router.patch(
  '/:id',
  [
    keycloak.allowRolesMiddleware('ministry_of_health'),
    keycloak.getUserInfoMiddleware(),
    expressRequestBodyValidator(UpdateAllocationSchema),
  ],
  asyncMiddleware(async (req, resp) => {
    if (!FEATURE_PHASE_ALLOCATION) {
      return resp.status(501).send('Phase allocation feature not active');
    }
    try {
      const { body, hcapUserInfo: user } = req;
      const response = await updateAllocation(req.params.id, body, user);
      logger.info({
        action: 'allocation_patch',
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

export default router;
