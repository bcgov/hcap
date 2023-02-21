import express from 'express';
import keycloak from '../keycloak';
import logger from '../logger';
import { asyncMiddleware } from '../error-handler';
import { CreatePhaseSchema } from '../validation';
import { expressRequestBodyValidator } from '../middleware';
import {
  createGlobalPhase,
  updateGlobalPhase,
  getAllSitePhases,
  getAllPhases,
} from '../services/phase';
import { getSitesForUser } from '../services/employers';
import { FEATURE_PHASE_ALLOCATION } from '../services/feature-flags';

const router = express.Router();

// Read: Get phases/allocations for site
router.get(
  '/:id',
  [
    keycloak.allowRolesMiddleware('health_authority', 'ministry_of_health', 'employer'),
    keycloak.getUserInfoMiddleware(),
  ],
  asyncMiddleware(async (req, res) => {
    /**
     * @type {import("../keycloak").hcapUserInfo} hcapUserInfo
     */
    const user = req.hcapUserInfo;
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
    keycloak.allowRolesMiddleware('ministry_of_health', 'health_authority'),
    keycloak.getUserInfoMiddleware(),
  ],
  asyncMiddleware(async (req, res) => {
    const { hcapUserInfo: user } = req;
    const result = await getAllPhases();

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
    keycloak.allowRolesMiddleware('ministry_of_health'),
    keycloak.getUserInfoMiddleware(),
    expressRequestBodyValidator(CreatePhaseSchema),
  ],
  asyncMiddleware(async (req, resp) => {
    if (!FEATURE_PHASE_ALLOCATION) {
      return resp.status(501).send('Phase allocation feature not active');
    }
    try {
      const { body, hcapUserInfo: user } = req;
      const response = await createGlobalPhase(body, user);
      logger.info({
        action: 'phase-allocation_post',
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
      return resp.status(400).send(`${err}`);
    }
  })
);

// Update Global Phase: PATCH
router.patch(
  '/:id',
  [
    keycloak.allowRolesMiddleware('ministry_of_health'),
    keycloak.getUserInfoMiddleware(),
    expressRequestBodyValidator(CreatePhaseSchema),
  ],
  asyncMiddleware(async (req, resp) => {
    if (!FEATURE_PHASE_ALLOCATION) {
      return resp.status(501).send('Phase allocation feature not active');
    }
    try {
      const { body, hcapUserInfo: user } = req;
      const response = await updateGlobalPhase(req.params.id, body, user);
      logger.info({
        action: 'phase-allocation_post',
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
      return resp.status(400).send(`${err}`);
    }
  })
);

export default router;
