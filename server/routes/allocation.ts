import express from 'express';
import { Role } from '../constants';
import keycloak from '../keycloak';
import logger from '../logger';
import { asyncMiddleware } from '../error-handler';
import {
  CreateAllocationSchema,
  UpdateAllocationSchema,
  BulkAllocationSchema,
} from '../validation';
import { expressRequestBodyValidator } from '../middleware';
import {
  createAllocation,
  updateAllocation,
  getAllocation,
  createBulkAllocation,
} from '../services/allocations';

const router = express.Router();

// Create phase allocation: POST
router.post(
  '/',
  [
    keycloak.allowRolesMiddleware(Role.MinistryOfHealth),
    keycloak.getUserInfoMiddleware(),
    expressRequestBodyValidator(CreateAllocationSchema),
  ],
  asyncMiddleware(async (req, resp) => {
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
    keycloak.allowRolesMiddleware(Role.MinistryOfHealth),
    keycloak.getUserInfoMiddleware(),
    expressRequestBodyValidator(UpdateAllocationSchema),
  ],
  asyncMiddleware(async (req, resp) => {
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

// Create bulk allocation: POST
router.post(
  '/bulk-allocation',
  [
    keycloak.allowRolesMiddleware(Role.MinistryOfHealth),
    keycloak.getUserInfoMiddleware(),
    expressRequestBodyValidator(BulkAllocationSchema),
  ],
  asyncMiddleware(async (req, resp) => {
    const { body, hcapUserInfo: user } = req;
    try {
      const response = await createBulkAllocation(body, user);
      logger.info({
        action: 'bulk_allocation_post',
        performed_by: {
          username: user.username,
          id: user.id,
        },
      });
      logger.info(response);
      return resp.status(201).json(response);
    } catch (err) {
      logger.error(err);
      return resp.status(400).send('Failed to set bulk allocations');
    }
  })
);

export default router;
