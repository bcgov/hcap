import express from 'express';
import keycloak from '../keycloak';
import logger from '../logger';
import { asyncMiddleware, applyMiddleware } from '../error-handler';
import {
  CreateReturnOfServiceSchema,
  ChangeReturnOfServiceSiteSchema,
  UpdateReturnOfServiceSchema,
  validate,
} from '../validators';
import {
  createReturnOfServiceStatus,
  updateReturnOfServiceStatus,
  getReturnOfServiceStatuses,
  logRosError,
} from '../services/return-of-service';
import { validateCredentials } from '../services/user-validation';
import { getSiteDetailsById } from '../services/employers';

const router = express.Router();

// Apply setup user middleware
router.use(applyMiddleware(keycloak.setupUserMiddleware()));

// Create a new return of service status
router.post(
  '/participant/:participantId',
  applyMiddleware(keycloak.allowRolesMiddleware('health_authority', 'employer')),
  asyncMiddleware(async (req, res) => {
    const actionName = 'ros-status-create';
    const { participantId } = req.params;
    const validationRes = await validateCredentials(req.user, participantId, actionName);
    if (!validationRes.isValid) {
      return res.status(validationRes.status).send(validationRes.message);
    }
    const { data, status, siteId } = req.body;
    await validate(CreateReturnOfServiceSchema, req.body);

    if (siteId) {
      // Validate siteId
      const [site] = await getSiteDetailsById(siteId);
      if (site.error) {
        return res.status(404).send(`Site not found: ${site.error}`);
      }
    }

    try {
      const response = await createReturnOfServiceStatus({
        participantId: validationRes.participant?.id,
        data,
        status,
        siteId,
      });
      logger.info({
        action: actionName,
        performed_by: validationRes.user,
        id: response.id,
      });
      return res.status(201).json(response);
    } catch (error) {
      const errRes = logRosError(actionName, error);
      return res.status(errRes.status).send(errRes.message);
    }
  })
);

// Change return of service status site
router.patch(
  '/participant/:participantId/change-site',
  applyMiddleware(keycloak.allowRolesMiddleware('health_authority', 'employer')),
  asyncMiddleware(async (req, res) => {
    const actionName = 'ros-change-site';
    const { participantId } = req.params;
    const validationRes = await validateCredentials(req.user, participantId, actionName);
    if (!validationRes.isValid) {
      return res.status(validationRes.status).send(validationRes.message);
    }
    const { data, status } = req.body;
    await validate(ChangeReturnOfServiceSiteSchema, req.body);

    try {
      const response = await updateReturnOfServiceStatus({
        participantId: validationRes.participant?.id,
        data,
        user: validationRes.user,
        status,
      });
      logger.info({
        action: actionName,
        performed_by: validationRes.user,
        id: response.id,
      });
      return res.status(201).json(response);
    } catch (error) {
      const errRes = logRosError(actionName, error);
      return res.status(errRes.status).send(errRes.message);
    }
  })
);

// Update return of service status
router.patch(
  '/participant/:participantId',
  applyMiddleware(keycloak.allowRolesMiddleware('ministry_of_health')),
  asyncMiddleware(async (req, res) => {
    const actionName = 'ros-status-update';
    const { participantId } = req.params;
    const validationRes = await validateCredentials(req.user, participantId, actionName);
    if (!validationRes.isValid) {
      return res.status(validationRes.status).send(validationRes.message);
    }
    const { data } = req.body;
    await validate(UpdateReturnOfServiceSchema, req.body);

    try {
      const response = await updateReturnOfServiceStatus({
        participantId: validationRes.participant?.id,
        data,
        user: validationRes.user,
      });
      logger.info({
        action: actionName,
        performed_by: validationRes.user,
        id: response.id,
      });
      return res.status(201).json(response);
    } catch (error) {
      const errRes = logRosError(actionName, error);
      return res.status(errRes.status).send(errRes.message);
    }
  })
);

// Get return of service status for participant
router.get(
  '/participant/:participantId',
  applyMiddleware(
    keycloak.allowRolesMiddleware('ministry_of_health', 'health_authority', 'employer')
  ),
  asyncMiddleware(async (req, res) => {
    const actionName = 'ros-status-get';
    const { participantId } = req.params;
    const validationRes = await validateCredentials(req.user, participantId, actionName);
    if (!validationRes.isValid) {
      return res.status(validationRes.status).send(validationRes.message);
    }
    const resp = await getReturnOfServiceStatuses({ participantId });
    logger.info({
      action: actionName,
      performed_by: validationRes.user,
      ids: resp.map((r) => r.id),
    });
    return res.status(200).json(resp);
  })
);

export default router;
