const express = require('express');
const keycloak = require('../keycloak');
const logger = require('../logger.js');
const { asyncMiddleware, applyMiddleware } = require('../error-handler.js');
const { getPSICohorts, getCohort, makeCohort } = require('../services/cohorts.js');

// Router
const router = express.Router();

// Apply setup user middleware
router.use(applyMiddleware(keycloak.setupUserMiddleware()));
// Apply role middleware
router.use(
  applyMiddleware(keycloak.allowRolesMiddleware('ministry_of_health', 'health_authority'))
);

// Get all cohorts attached to the given PSI
router.get(
  '/',
  asyncMiddleware(async (req, res) => {
    const { email, user_id: userId, sub: localUserId } = req.user;

    // our local deployment of keycloak holds the userId under the 'sub' key
    // rather than 'user_id'
    if (email && (userId || localUserId)) {
      // Parsing the PSI ID from the base URL
      const splitURL = req.baseUrl.split('/');
      const psiIndex = splitURL.findIndex((entry) => entry === 'psi');
      const psiID = splitURL[psiIndex + 1];

      const response = await getPSICohorts(psiID);
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

// Get one cohort with its id
router.get(
  '/:id',
  asyncMiddleware(async (req, res) => {
    const { user_id: userId, sub: localUserId } = req.user;
    const user = userId || localUserId;
    const id = parseInt(req.params.id, 10);
    const [psi] = await getCohort(id);
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

// Post a cohort
router.post(
  '/',
  asyncMiddleware(async (req, res) => {
    const { email, user_id: userId, sub: localUserId } = req.user;
    const user = userId || localUserId;
    if (email && user) {
      const response = await makeCohort(req.body);
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
