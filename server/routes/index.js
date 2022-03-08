// Index route for /api/v1
const dayjs = require('dayjs');
const express = require('express');
const { getSites } = require('../services/employers.js');
const { validate, AccessRequestApproval } = require('../validation.js');
const logger = require('../logger.js');
const { dbClient, collections } = require('../db');
const { asyncMiddleware } = require('../error-handler.js');
const keycloak = require('../keycloak.js');
const { healthCheck } = require('../services/health-check');
const participantUserRoute = require('./participant-user');
const { sanitize } = require('../utils');
const {
  participantRouter,
  participantsRouter,
  newHiredParticipantRouter,
  employerActionsRouter,
} = require('./participant');

const { userDetailsRouter } = require('./user');
const employerSitesRouter = require('./employer-sites');
const employerFormRouter = require('./employer-form');
const psiRouter = require('./post-secondary-institutes');
const cohortRouter = require('./cohorts');
const milestoneReportRouter = require('./milestone-report');
const postHireStatusRouter = require('./post-hire-status');
const rosRouter = require('./return-of-service');

const apiRouter = express.Router();
apiRouter.use(keycloak.expressMiddleware());

// Applying router handlers

apiRouter.use(`/participant-user`, participantUserRoute);

apiRouter.use(`/participant`, participantRouter);
apiRouter.use(`/participants`, participantsRouter);
apiRouter.use(`/new-hired-participant`, newHiredParticipantRouter);
apiRouter.use(`/employer-actions`, employerActionsRouter);

// Employer-sites
apiRouter.use('/employer-sites', employerSitesRouter);
apiRouter.use('/employer-sites-detail', employerSitesRouter);

// PSI Routes
apiRouter.use(`/psi`, psiRouter);
apiRouter.use(`/cohorts`, cohortRouter);

// Employer-form
apiRouter.use('/employer-form', employerFormRouter);
// User-details
apiRouter.use('/user-details', userDetailsRouter);
// Milestone report
apiRouter.use('/milestone-report', milestoneReportRouter);

// Post hire status
apiRouter.use('/post-hire-status', postHireStatusRouter);

// Return of service
apiRouter.use('/ros', rosRouter);

// Return client info for Keycloak realm for the current environment
apiRouter.get(`/keycloak-realm-client-info`, (req, res) =>
  res.json({
    ...keycloak.RealmInfoFrontend(),
    envVariables: {
      APP_ENV: process.env.APP_ENV,
    },
  })
);

// Get pending users from Keycloak
apiRouter.get(
  `/pending-users`,
  keycloak.allowRolesMiddleware('ministry_of_health'),
  asyncMiddleware(async (req, res) => {
    const users = await keycloak.getPendingUsers();
    const scrubbed = users.map((user) => ({
      id: user.id,
      emailAddress: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: dayjs(user.createdTimestamp).format('YYYY-MM-DD HH:mm'),
    }));
    return res.json({ data: scrubbed });
  })
);

// Get users from Keycloak
apiRouter.get(
  `/users`,
  keycloak.allowRolesMiddleware('ministry_of_health'),
  asyncMiddleware(async (req, res) => {
    const users = await keycloak.getUsers(true);
    const scrubbed = users.map((user) => ({
      id: user.id,
      emailAddress: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: dayjs(user.createdTimestamp).format('YYYY-MM-DD HH:mm'),
    }));
    return res.json({ data: scrubbed });
  })
);

apiRouter.post(
  `/approve-user`,
  keycloak.allowRolesMiddleware('ministry_of_health'),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    await validate(AccessRequestApproval, req.body);
    await keycloak.setUserRoles(
      sanitize(req.body.userId),
      sanitize(req.body.role),
      req.body.regions
    );
    await dbClient.db.saveDoc(collections.USERS, {
      keycloakId: req.body.userId,
      sites: req.body.sites,
    });

    const user = req.hcapUserInfo;
    logger.info({
      action: 'approve-user_post',
      performed_by: {
        username: user.username,
        id: user.id,
      },
      role_assigned: req.body.role,
      granted_access_to: req.body.userId,
      regions_assigned: req.body.regions,
      siteIds_assigned: req.body.sites,
    });

    return res.status(201).json({});
  })
);

// Get user info from token
apiRouter.get(
  `/user`,
  keycloak.allowRolesMiddleware('*'),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    let sites = await getSites();
    sites = sites.filter((i) => req.hcapUserInfo.sites.includes(i.siteId));
    return res.json({
      roles: req.hcapUserInfo.roles,
      name: req.hcapUserInfo.name,
      sites,
    });
  })
);

// Version number
apiRouter.get(`/version`, (req, res) => res.json({ version: process.env.VERSION }));

// Health check
apiRouter.get(
  `/healthcheck`,
  asyncMiddleware(async (req, res) => {
    const health = await healthCheck();
    res.status(200).json(health);
  })
);

module.exports = apiRouter;
