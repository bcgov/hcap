const express = require('express');
const keycloak = require('../keycloak');
const logger = require('../logger.js');
const { asyncMiddleware, applyMiddleware } = require('../error-handler.js');
const {
  CreateReturnOfServiceSchema,
  UpdateReturnOfServiceSchema,
  validate,
} = require('../validators');
const {
  makeReturnOfServiceStatus,
  getReturnOfServiceStatuses,
  getRosErrorMessage,
} = require('../services/return-of-service');
const { validateCredentials } = require('../services/user-validation');
const { getSiteDetailsById, getDetailsBySiteId } = require('../services/employers');

const router = express.Router();

// Apply setup user middleware
router.use(applyMiddleware(keycloak.setupUserMiddleware()));

// Create a new return of service status
router.post(
  '/participant/:participantId',
  applyMiddleware(
    keycloak.allowRolesMiddleware('ministry_of_health', 'health_authority', 'employer')
  ),
  asyncMiddleware(async (req, res) => {
    const actionName = 'ros-status-create';
    const { participantId } = req.params;
    const validationRes = await validateCredentials(req.user, participantId, actionName);
    if (!validationRes.isValid) {
      return res.status(validationRes.status).send(validationRes.message);
    }
    const { data, status, siteId, newSiteId, assignNewSite, isUpdating } = req.body;
    await validate(
      isUpdating ? UpdateReturnOfServiceSchema : CreateReturnOfServiceSchema,
      req.body
    );

    if (siteId) {
      // Validate siteId
      const [site] = await getSiteDetailsById(siteId);
      if (site.error) {
        return res.status(404).send(`Site not found: ${site.error}`);
      }
    }

    let assignNewSiteId;
    if (newSiteId) {
      const [newSite] = await getDetailsBySiteId(newSiteId);
      if (newSite.error) {
        return res.status(404).send(`Site not found: ${newSite.error}`);
      }
      assignNewSiteId = newSite?.id;
    }

    try {
      const response = await makeReturnOfServiceStatus({
        participantId: validationRes.participant?.id,
        data,
        status,
        siteId,
        newSiteId: assignNewSiteId,
        assignNewSite,
        user: validationRes.user,
        isUpdating,
      });
      logger.info({
        action: actionName,
        performed_by: validationRes.user,
        id: response.id,
      });
      return res.status(201).json(response);
    } catch (error) {
      logger.error({
        action: actionName,
        error: error.message,
      });
      const errMessage = getRosErrorMessage(error.message);
      return res.status(errMessage.statusCode || 400).send(errMessage.label || 'Server error');
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

module.exports = router;
