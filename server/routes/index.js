const csv = require('fast-csv');
const dayjs = require('dayjs');
const express = require('express');
const {
  getHiredParticipantsBySite,
  getWithdrawnParticipantsBySite,
  getParticipantsForUser,
} = require('../services/participants.js');
const {
  getEmployers,
  getEmployerByID,
  saveSingleSite,
  getSites,
  getSiteByID,
  updateSite,
} = require('../services/employers.js');
const { getReport, getHiredParticipantsReport } = require('../services/reporting.js');
const { getUserSites } = require('../services/user.js');
const {
  validate,
  EmployerFormSchema,
  AccessRequestApproval,
  CreateSiteSchema,
  EditSiteSchema,
} = require('../validation.js');
const logger = require('../logger.js');
const { dbClient, collections } = require('../db');
const { asyncMiddleware } = require('../error-handler.js');
const keycloak = require('../keycloak.js');
const { healthCheck } = require('../services/health-check');
const participantUserRoute = require('./participant-user');
const {
  participantRouter,
  participantsRouter,
  newHiredParticipantRouter,
  employerActionsRouter,
} = require('./participant');

const employerSitesRoute = require('./employer-sites');

const apiRouter = express.Router();
apiRouter.use(keycloak.expressMiddleware());

// Applying router handlers

apiRouter.use(`/participant-user`, participantUserRoute);

apiRouter.use(`/participant`, participantRouter);
apiRouter.use(`/participants`, participantsRouter);
apiRouter.use(`/new-hired-participant`, newHiredParticipantRouter);
apiRouter.use(`/employer-actions`, employerActionsRouter);

// Employer-sites
apiRouter.use('/employer-sites', employerSitesRoute);
apiRouter.use('/employer-sites-detail', employerSitesRoute);

// Return client info for Keycloak realm for the current environment
apiRouter.get(`/keycloak-realm-client-info`, (req, res) => res.json(keycloak.RealmInfoFrontend()));

// Create new employer form
apiRouter.post(
  `/employer-form`,
  asyncMiddleware(async (req, res) => {
    await validate(EmployerFormSchema, req.body);
    const result = await dbClient.db.saveDoc(collections.EMPLOYER_FORMS, req.body);
    logger.info(`Form ${result.id} successfully created.`);
    return res.status(201).json({ id: result.id });
  })
);

// Get employer forms
apiRouter.get(
  `/employer-form`,
  keycloak.allowRolesMiddleware('health_authority', 'ministry_of_health'),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    const user = req.hcapUserInfo;
    const result = await getEmployers(user);
    return res.json({ data: result });
  })
);

apiRouter.get(
  `/employer-form/:id`,
  keycloak.allowRolesMiddleware('health_authority', 'ministry_of_health'),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    const user = req.hcapUserInfo;
    const [result] = await getEmployerByID(req.params.id);
    logger.info({
      action: 'employer-form_get_details',
      performed_by: {
        username: user.username,
        id: user.id,
        regions: user.regions,
      },
      form_viewed: req.params.id,
    });
    if (user.isHA && !user.regions.includes(result.healthAuthority)) {
      return res.status(403).json({ error: 'you do not have permissions to view this form' });
    }
    return res.json(result);
  })
);

// Get Report
apiRouter.get(
  `/milestone-report`,
  keycloak.allowRolesMiddleware('ministry_of_health'),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    const result = await getReport();
    return res.json({ data: result });
  })
);

// Get hired report
apiRouter.get(
  `/milestone-report/csv/hired`,
  keycloak.allowRolesMiddleware('ministry_of_health'),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    const user = req.hcapUserInfo;
    res.attachment('report.csv');
    const csvStream = csv.format({ headers: true });
    csvStream.pipe(res);

    const results = await getHiredParticipantsReport();
    results.forEach((result) => {
      csvStream.write({
        'Participant ID': result.participantId,
        FSA: result.participantFsa,
        'Employer ID': result.employerId,
        'Employer Email': result.employerEmail,
        'HCAP Position': result.hcapPosition,
        'Position Type': result.positionType,
        'Position Title': result.positionTitle,
        'Employer Site Region': result.employerRegion,
        'Employer Site': result.employerSite,
        'Start Date': result.startDate,
        'Regional Health Office': result.isRHO,
        'Withdraw Reason': result.withdrawReason,
        'Withdraw Date': result.withdrawDate,
      });
    });

    logger.info({
      action: 'milestone-report_get_csv_hired',
      performed_by: {
        username: user.username,
        id: user.id,
      },
    });

    csvStream.end();
  })
);

// Get linked participants for users
apiRouter.get(
  `/user/participants`,
  keycloak.setupUserMiddleware(),
  asyncMiddleware(async (req, res) => {
    const { email, user_id: userId } = req.user;
    if (email && userId) {
      const response = await getParticipantsForUser(userId, email);
      logger.info({
        action: 'user_participant_get',
        performed_by: userId,
        id: response.length > 0 ? response[0].id : '',
      });
      res.status(200).json(response);
    } else {
      res.status(401).send('Unauthorized user');
    }
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

// Get user details - Different from /user, this returns the
// full user sites and role specified in the query id
apiRouter.get(
  `/user-details`,
  keycloak.allowRolesMiddleware('ministry_of_health'),
  asyncMiddleware(async (req, res) => {
    const userId = req.query.id;
    const roles = await keycloak.getUserRoles(userId);
    const sites = await getUserSites(userId);
    return res.json({
      roles,
      sites,
    });
  })
);

apiRouter.patch(
  `/user-details`,
  keycloak.allowRolesMiddleware('ministry_of_health'),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    await validate(AccessRequestApproval, req.body);
    await keycloak.setUserRoles(req.body.userId, req.body.role, req.body.regions);
    await dbClient.db[collections.USERS].updateDoc(
      {
        keycloakId: req.body.userId,
      },
      {
        sites: req.body.sites,
      }
    );

    const user = req.hcapUserInfo;
    logger.info({
      action: 'user-details_patch',
      performed_by: {
        username: user.username,
        id: user.id,
      },
      role_assigned: req.body.role,
      granted_access_to: req.body.userId,
      regions_assigned: req.body.regions,
      siteIds_assigned: req.body.sites,
    });

    return res.json({});
  })
);

apiRouter.post(
  `/approve-user`,
  keycloak.allowRolesMiddleware('ministry_of_health'),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    await validate(AccessRequestApproval, req.body);
    await keycloak.setUserRoles(req.body.userId, req.body.role, req.body.regions);
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
