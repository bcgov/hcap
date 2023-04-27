import express from 'express';
import { Role, UserRoles } from '../constants';
import keycloak from '../keycloak';
import logger from '../logger';
import { asyncMiddleware } from '../error-handler';
import { CreatePhaseSchema, UpdatePhaseSchema } from '../validation';
import { expressRequestBodyValidator } from '../middleware';
import {
  createPhase,
  updatePhase,
  getAllSitePhases,
  getAllPhases,
  checkDateOverlap,
} from '../services/phase';
import { getSitesForUser } from '../services/employers';
import type { HcapUserInfo } from '../keycloak';

const router = express.Router();

// Read: Get phases/allocations for site
router.get(
  '/:id',
  [keycloak.allowRolesMiddleware(...UserRoles), keycloak.getUserInfoMiddleware()],
  asyncMiddleware(async (req, res) => {
    const user: HcapUserInfo = req.hcapUserInfo;
    const siteId = parseInt(req.params.id, 10);

    // Validate request
    if (!siteId) return res.status(400).send('Invalid site ID');
    const authorized =
      user.isSuperUser ||
      user.isMoH ||
      user.isHA ||
      (user.isEmployer && (await getSitesForUser(user)).map((site) => site.id).includes(siteId));
    if (!authorized) return res.status(403).send('Unauthorized site ID');

    // Get and return data
    try {
      const result = await getAllSitePhases(siteId);
      logger.info({
        action: 'phases_get',
        performed_by: {
          username: user.username,
          id: user.id,
        },
        phases_accessed: result.map((phase) => phase.id),
        for_site: siteId,
      });
      return res.json({ data: result });
    } catch (error) {
      return error.message.includes('No site found')
        ? res.status(400).send('Invalid site ID')
        : res.status(500).send('Failed to get phases for site');
    }
  })
);

// Read: Get global phases
router.get(
  '/',
  [
    keycloak.allowRolesMiddleware(Role.MinistryOfHealth, Role.HealthAuthority),
    keycloak.getUserInfoMiddleware(),
  ],
  asyncMiddleware(async (req, res) => {
    const { query, hcapUserInfo: user } = req;
    const result = await getAllPhases(query?.includeAllocations);

    logger.info({
      action: 'phases_get',
      performed_by: {
        username: user.username,
        id: user.id,
      },
      phases_accessed: result.map((phase) => phase.id),
    });
    return res.json({ data: result });
  })
);

// Create Global Phase: POST
router.post(
  '/',
  [
    keycloak.allowRolesMiddleware(Role.MinistryOfHealth),
    keycloak.getUserInfoMiddleware(),
    expressRequestBodyValidator(CreatePhaseSchema),
  ],
  asyncMiddleware(async (req, resp) => {
    const isRangeInvalid = await checkDateOverlap(req.body.start_date, req.body.end_date);
    if (isRangeInvalid)
      return resp
        .status(400)
        .send('Failed to create phase due to overlapping dates with existing phases');
    try {
      const { body, hcapUserInfo: user } = req;
      const response = await createPhase(body, user);
      logger.info({
        action: 'phase_post',
        performed_by: {
          username: user.username,
          id: user.id,
        },
        globalPhaseId: response.id,
      });
      logger.info(response);
      return resp.status(201).json(response);
    } catch (err) {
      logger.error(err);
      return resp.status(400).send('Failed to create phase');
    }
  })
);

// Update Global Phase: PATCH
router.patch(
  '/:id',
  [
    keycloak.allowRolesMiddleware(Role.MinistryOfHealth),
    keycloak.getUserInfoMiddleware(),
    expressRequestBodyValidator(UpdatePhaseSchema),
  ],
  asyncMiddleware(async (req, resp) => {
    const isRangeInvalid = await checkDateOverlap(
      req.body.start_date,
      req.body.end_date,
      req.params.id
    );
    if (isRangeInvalid)
      return resp
        .status(400)
        .send('Failed to update phase due to overlapping dates with existing phases');
    try {
      const { body, hcapUserInfo: user } = req;
      const response = await updatePhase(req.params.id, body, user);
      logger.info({
        action: 'phase_patch',
        performed_by: {
          username: user.username,
          id: user.id,
        },
        globalPhaseId: response.id,
      });
      logger.info(response);
      return resp.status(201).json(response);
    } catch (err) {
      logger.error(err);
      return resp.status(400).send('Failed to update phase');
    }
  })
);

export default router;
