const express = require('express');
const keycloak = require('../keycloak');
const logger = require('../logger.js');
const { asyncMiddleware, applyMiddleware } = require('../error-handler.js');
const { getCohorts, getCohort } = require('../services/cohorts.js');

// Router
const router = express.Router();

// Apply setup user middleware
router.use(applyMiddleware(keycloak.setupUserMiddleware()));
// Apply role middleware
router.use(applyMiddleware(keycloak.allowRolesMiddleware('ministry_of_health')));

// Get all cohorts
router.get(
  '/',
  asyncMiddleware(async (req, res) => {
    const { email, user_id: userId, sub: localUserId } = req.user;

    // our local deployment of keycloak holds the userId under the 'sub' key
    // rather than 'user_id'
    if (email && (userId || localUserId)) {
      const response = await getCohorts();
      logger.info({
        action: 'cohorts_get',
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
    const [cohort] = await getCohort(id);
    if (cohort === undefined) {
      return res.status(401).send({ message: 'You do not have permission to view this record' });
    }
    logger.info({
      action: 'cohort_get',
      performed_by: {
        user,
      },
      id: cohort.id || '',
    });

    return res.status(200).json(cohort);
  })
);

module.exports = router;
