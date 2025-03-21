// Index route for /api/v1
import express from 'express';
import { Role, UserRoles } from '../constants';
import { getSitesForUser } from '../services/employers';
import { getUserMigrations, getUserNotifications, updateUserForMigration } from '../services/user';
import { validate, AccessRequestApproval } from '../validation';
import logger from '../logger';
import { dbClient, collections } from '../db';
import { asyncMiddleware } from '../error-handler';
import keycloak from '../keycloak';
import { healthCheck } from '../services/health-check';
import participantUserRoute from './participant-user';
import { sanitize, scrubUsers } from '../utils';
import {
  participantRouter,
  participantsRouter,
  newHiredParticipantRouter,
  employerActionsRouter,
} from './participant';

import { userDetailsRouter } from './user';
import employerSitesRouter from './employer-sites';
import phaseRouter from './phase';
import allocationRouter from './allocation';
import employerFormRouter from './employer-form';
import psiRouter from './post-secondary-institutes';
import cohortRouter from './cohorts';
import psiReportRouter from './psi-report';
import programMonitoringReportRouter from './program-monitoring-report';
import milestoneReportRouter from './milestone-report';
import postHireStatusRouter from './post-hire-status';
import rosRouter from './return-of-service';
import * as featureFlags from '../services/feature-flags';

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

// Phase/Allocation
apiRouter.use('/phase', phaseRouter);
apiRouter.use('/allocation', allocationRouter);
apiRouter.use('/allocation/bulk-allocation', allocationRouter);

// PSI Routes
apiRouter.use(`/psi`, psiRouter);
apiRouter.use(`/cohorts`, cohortRouter);
apiRouter.use(`/psi-report`, psiReportRouter);

// Program Monitoring Report
apiRouter.use(`/program-monitoring-report`, programMonitoringReportRouter);

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
      ...featureFlags,
    },
  })
);

// Get pending users from Keycloak
apiRouter.get(
  `/pending-users`,
  keycloak.allowRolesMiddleware(Role.MinistryOfHealth),
  asyncMiddleware(async (req, res) => {
    const users = await keycloak.getPendingUsers();
    return res.json({ data: scrubUsers(users) });
  })
);

// Get users from Keycloak
apiRouter.get(
  `/users`,
  keycloak.allowRolesMiddleware(Role.MinistryOfHealth),
  asyncMiddleware(async (req, res) => {
    const users = await keycloak.getUsers(UserRoles);
    return res.json({ data: scrubUsers(users) });
  })
);

// Get users to be migrated
apiRouter.get(
  `/user-migrations`,
  keycloak.allowRolesMiddleware('ministry_of_health'),
  asyncMiddleware(async (req, res) => {
    const users = await getUserMigrations();
    return res.json({ data: users });
  })
);

// Update user in user migration table
apiRouter.patch(
  `/user-migrations/:id`,
  keycloak.allowRolesMiddleware('ministry_of_health'),
  asyncMiddleware(async (req, res) => {
    const { id } = req.params;
    const { username, emailAddress: email } = req.body;

    await updateUserForMigration(id, { username, email });
    return res.json({});
  })
);

apiRouter.post(
  `/approve-user`,
  keycloak.allowRolesMiddleware(Role.MinistryOfHealth),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    await validate(AccessRequestApproval, req.body);
    await keycloak.setUserRoleWithRegions(
      sanitize(req.body.userId),
      sanitize(req.body.role),
      req.body.regions
    );
    const userInfo = await keycloak.getUser(sanitize(req.body.username));
    await dbClient.db?.saveDoc(collections.USERS, {
      keycloakId: req.body.userId,
      sites: req.body.sites,
      userInfo,
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
    const { hcapUserInfo: user } = req;
    const sites = await getSitesForUser(user);
    const notifications = await getUserNotifications(req.hcapUserInfo);
    return res.json({
      roles: req.hcapUserInfo.roles,
      name: req.hcapUserInfo.name,
      sites,
      notifications,
    });
  })
);

apiRouter.get(
  `/user-notifications`,
  keycloak.allowRolesMiddleware('*'),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    const notifications = await getUserNotifications(req.hcapUserInfo);
    return res.json({
      notifications,
    });
  })
);

// Version number
apiRouter.get(`/version`, (req, res) => res.json({ version: process.env.VERSION }));

// Health check
export default apiRouter.get(
  `/healthcheck`,
  asyncMiddleware(async (req, res) => {
    const health = await healthCheck();
    res.status(200).json(health);
  })
);
