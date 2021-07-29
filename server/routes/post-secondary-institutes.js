const express = require('express');
const keycloak = require('../keycloak');
const logger = require('../logger.js');
const { asyncMiddleware, applyMiddleware } = require('../error-handler.js');
const { getPSI, getPSIs, makePSI } = require('../services/post-secondary-institutes');

const cohortRoute = require('./psi-cohorts');

// Router
const router = express.Router();

// Apply setup user middleware
router.use(applyMiddleware(keycloak.setupUserMiddleware()));
// Apply role middleware
router.use(applyMiddleware(keycloak.allowRolesMiddleware('ministry_of_health')));

// Catch all requests for cohort and route them separately
router.use(`/:id/cohorts`, cohortRoute);

// Get All Post-Secondary Institutes
router.get(
  '/',
  asyncMiddleware(async (req, res) => {
    const { email, user_id: userId, sub: localUserId } = req.user;

    // our local deployment of keycloak holds the userId under the 'sub' key
    // rather than 'user_id'
    if (email && (userId || localUserId)) {
      const response = await getPSIs();
      logger.info({
        action: 'post-secondary-institutes_get',
        performed_by: userId || localUserId,
        id: response.length > 0 ? response[0].id : '',
      });
      res.status(200).json(response);
    } else {
      res.status(401).send('Unauthorized user');
    }
  })
);

//  Get a specific PSI by its ID
router.get(
  '/:id',
  asyncMiddleware(async (req, res) => {
    const { user_id: userId, sub: localUserId } = req.user;
    const user = userId || localUserId;
    const id = parseInt(req.params.id, 10);
    const [psi] = await getPSI(id);
    if (psi === undefined) {
      return res.status(401).send({ message: 'You do not have permission to view this record' });
    }
    logger.info({
      action: 'post-secondary-institute_get',
      performed_by: {
        user,
      },
      id: psi.length > 0 ? psi.id : '',
    });

    return res.status(200).json(psi);
  })
);

// Post a new PSI
router.post(
  '/',
  asyncMiddleware(async (req, res) => {
    const { email, user_id: userId, sub: localUserId } = req.user;
    const user = userId || localUserId;
    if (email && user) {
      const response = await makePSI(req.body);
      if (response.error) {
        res.status(400).send(response);
      }
      logger.info({
        action: 'post-secondary-institutes_post',
        performed_by: user,
        id: response !== undefined ? response.id : '',
      });
      res.status(200).json(response);
    } else {
      res.status(401).send('Unauthorized user');
    }
  })
);

module.exports = router;
