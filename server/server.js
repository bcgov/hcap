const cors = require('cors');
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const path = require('path');
const csv = require('fast-csv');
const dayjs = require('dayjs');
const {
  getHiredParticipantsBySite,
  getWithdrawnParticipantsBySite,
  getParticipantsForUser,
} = require('./services/participants.js');
const {
  getEmployers,
  getEmployerByID,
  saveSingleSite,
  getSites,
  getSiteByID,
  updateSite,
} = require('./services/employers.js');
const { getReport, getHiredParticipantsReport } = require('./services/reporting.js');
const { getUserSites } = require('./services/user.js');
const {
  validate,
  EmployerFormSchema,
  AccessRequestApproval,
  CreateSiteSchema,
  EditSiteSchema,
} = require('./validation.js');
const logger = require('./logger.js');
const { dbClient, collections } = require('./db');
const { errorHandler, asyncMiddleware } = require('./error-handler.js');
const keycloak = require('./keycloak.js');
const { healthCheck } = require('./services/health-check');

// Routes
const {
  participantUserRoute,
  participantRouter,
  participantsRouter,
  newHiredParticipantRouter,
  employerActionsRouter,
} = require('./routes');

const apiBaseUrl = '/api/v1';
const app = express();

if (process.env.NODE_ENV === 'local') {
  app.use(cors());
}

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        'default-src': ["'self'"],
        'connect-src': [
          "'self'",
          'https://*.apps.gov.bc.ca',
          'https://orgbook.gov.bc.ca',
          'https://*.oidc.gov.bc.ca',
          'https://oidc.gov.bc.ca',
        ],
        'base-uri': ["'self'"],
        'block-all-mixed-content': [],
        'font-src': ["'self'", 'https:', 'data:'],
        'frame-ancestors': ["'self'"],
        'img-src': ["'self'", 'data:'],
        'object-src': ["'none'"],
        'script-src': ["'self'", 'https://*.gov.bc.ca'],
        'script-src-attr': ["'none'"],
        'style-src': ["'self'", 'https:', "'unsafe-inline'"],
        'upgrade-insecure-requests': [],
        'form-action': ["'self'"],
      },
    },
  })
);

app.use(
  morgan(
    ':date[iso] | :remote-addr | :remote-user | ":method :url HTTP/:http-version" | :status | :res[content-length]',
    {
      skip: (req) => {
        const { path: pathName } = req;
        return pathName.includes('/static/') || pathName.includes('/api/v1/healthcheck');
      },
    }
  )
);
app.use(keycloak.expressMiddleware());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../client/build')));

// Return client info for Keycloak realm for the current environment
app.get(`${apiBaseUrl}/keycloak-realm-client-info`, (req, res) =>
  res.json(keycloak.RealmInfoFrontend())
);

// Create new employer form
app.post(
  `${apiBaseUrl}/employer-form`,
  asyncMiddleware(async (req, res) => {
    await validate(EmployerFormSchema, req.body);
    const result = await dbClient.db.saveDoc(collections.EMPLOYER_FORMS, req.body);
    logger.info(`Form ${result.id} successfully created.`);
    return res.status(201).json({ id: result.id });
  })
);

// Get employer forms
app.get(
  `${apiBaseUrl}/employer-form`,
  keycloak.allowRolesMiddleware('health_authority', 'ministry_of_health'),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    const user = req.hcapUserInfo;
    const result = await getEmployers(user);
    return res.json({ data: result });
  })
);

app.get(
  `${apiBaseUrl}/employer-form/:id`,
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
app.get(
  `${apiBaseUrl}/milestone-report`,
  keycloak.allowRolesMiddleware('ministry_of_health'),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    const result = await getReport();
    return res.json({ data: result });
  })
);

// Get hired report
app.get(
  `${apiBaseUrl}/milestone-report/csv/hired`,
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
        'Intent To Rehire': result?.rehire,
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
app.get(
  `${apiBaseUrl}/user/participants`,
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
app.get(
  `${apiBaseUrl}/pending-users`,
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
app.get(
  `${apiBaseUrl}/users`,
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
app.get(
  `${apiBaseUrl}/user-details`,
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

// Create single employer site
app.post(
  `${apiBaseUrl}/employer-sites`,
  keycloak.allowRolesMiddleware('ministry_of_health'),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    await validate(CreateSiteSchema, req.body);
    try {
      const user = req.hcapUserInfo;
      const response = await saveSingleSite(req.body);

      logger.info({
        action: 'employer-sites_post',
        performed_by: {
          username: user.username,
          id: user.id,
        },
        site_id: response.siteId,
      });

      return res.status(201).json(response);
    } catch (excp) {
      if (excp.code === '23505') {
        return res.status(400).send({ siteId: req.body.siteId, status: 'Duplicate' });
      }
      return res.status(400).send(`${excp}`);
    }
  })
);

app.patch(
  `${apiBaseUrl}/employer-sites/:id`,
  keycloak.allowRolesMiddleware('ministry_of_health'),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    await validate(EditSiteSchema, req.body);
    const user = req.hcapUserInfo;
    try {
      const response = await updateSite(req.params.id, req.body);
      logger.info({
        action: 'employer-sites_patch',
        performed_by: {
          username: user.username,
          id: user.id,
        },
        siteID: req.params.id,
      });
      return res.json(response);
    } catch (excp) {
      return res.status(400).send(`${excp}`);
    }
  })
);

app.get(
  `${apiBaseUrl}/employer-sites`,
  keycloak.allowRolesMiddleware('health_authority', 'ministry_of_health'),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    let result = await getSites();
    const user = req.hcapUserInfo;

    if (user.isHA) {
      result = result.filter((site) => user.regions.includes(site.healthAuthority));
    }

    logger.info({
      action: 'employer-sites_get',
      performed_by: {
        username: user.username,
        id: user.id,
      },
      sites_accessed: result.map((site) => site.siteId),
    });
    return res.json({ data: result });
  })
);

app.get(
  `${apiBaseUrl}/employer-sites/:id`,
  keycloak.allowRolesMiddleware('health_authority', 'ministry_of_health'),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    const user = req.hcapUserInfo;
    const [result] = await getSiteByID(req.params.id);
    logger.info({
      action: 'employer-sites-detail_get',
      performed_by: {
        username: user.username,
        id: user.id,
      },
      site_internal_id: result.id,
      site_id: result.siteId,
    });
    if (user.isHA && !user.regions.includes(result.healthAuthority)) {
      return res.status(403).json({ error: 'you do not have permissions to view this site' });
    }
    return res.json(result);
  })
);

app.get(
  `${apiBaseUrl}/employer-sites/:id/participants`,
  keycloak.allowRolesMiddleware('health_authority', 'ministry_of_health'),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    const user = req.hcapUserInfo;
    const { id } = req.params;
    const hired = await getHiredParticipantsBySite(id);
    const withdrawn = await getWithdrawnParticipantsBySite(id);

    logger.info({
      action: 'site-participants_get',
      performed_by: {
        username: user.username,
        id: user.id,
      },
      on: {
        site: id,
      },
      for: {
        hiredParticipants: hired.map((ppt) => ppt.participantJoin.id),
        withdrawnParticipants: withdrawn.map((ppt) => ppt.participantJoin.id),
      },
    });
    return res.json({ hired, withdrawn });
  })
);

/**
 * @deprecated since Feb 2021
 * This endpoint was a misnomer, it was named sites but actually retrieved a single EEOI:
 *   /employer-form/:id - EEOI details, direct replacement for this function
 *   /employer-sites/:id - new site details endpoint
 */
app.get(
  `${apiBaseUrl}/employer-sites-detail`,
  keycloak.allowRolesMiddleware('health_authority', 'ministry_of_health'),
  keycloak.getUserInfoMiddleware(),
  asyncMiddleware(async (req, res) => {
    const user = req.hcapUserInfo;
    logger.info({
      action: 'employer-sites-detail_get',
      performed_by: {
        username: user.username,
        id: user.id,
      },
      eeoi_id: req.query.id,
    });
    return res.json({ data: '' });
  })
);

app.patch(
  `${apiBaseUrl}/user-details`,
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

app.post(
  `${apiBaseUrl}/approve-user`,
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
app.get(
  `${apiBaseUrl}/user`,
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
app.get(`${apiBaseUrl}/version`, (req, res) => res.json({ version: process.env.VERSION }));

// Health check
app.get(
  `${apiBaseUrl}/healthcheck`,
  asyncMiddleware(async (req, res) => {
    const health = await healthCheck();
    res.status(200).json(health);
  })
);

app.get(
  `${apiBaseUrl}/error`,
  asyncMiddleware(async (req, res) => {
    const errorStatusCode = _.random(500, 511);
    res.status(errorStatusCode).json({});
  })
);

// Applying router handlers
app.use(`${apiBaseUrl}/participant-user`, participantUserRoute);

app.use(`${apiBaseUrl}/participant`, participantRouter);
app.use(`${apiBaseUrl}/participants`, participantsRouter);
app.use(`${apiBaseUrl}/new-hired-participant`, newHiredParticipantRouter);
app.use(`${apiBaseUrl}/employer-actions`, employerActionsRouter);

// Client app
if (process.env.NODE_ENV === 'production') {
  app.get('/*', (req, res) => res.sendFile(path.join(__dirname, '../client/build/index.html')));
}

app.use(errorHandler);

module.exports = app;
