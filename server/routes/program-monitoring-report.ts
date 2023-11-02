import express from 'express';
import * as csv from 'fast-csv';
import keycloak, { HcapUserInfo } from '../keycloak';
import logger from '../logger';
import { asyncMiddleware } from '../error-handler';
import { Role } from '../constants';
import { getProgramMonitoringReport } from '../services/reporting';

// Router
const router = express.Router();

router.use(keycloak.getUserInfoMiddleware());

/**
 * Generate Program Monitoring report
 * @param csvStream output stream
 */
const generateProgramMonitoringReport = async (csvStream) => {
  const results = await getProgramMonitoringReport();

  results.forEach((result) => {
    csvStream.write({
      'Participant ID': result.participantId,
      'PEOI Submission Date': result.created_at,
      "HA's Applied To": result.preferredLocation,
      Marketing: result.reasonForFindingOut,
      'Work Experience': result.currentOrMostRecentIndustry,
      'MHSU Sector Experience': result.experienceWithMentalHealthOrSubstanceUse,
      Indigenous: result.indigenous,
      Pathway: result.program,
    });
  });
};

/**
 * Template for generating a Program Monitoring report
 * @param user user data of a person requesting report
 * @param res response
 */
const generateReport = async (user: HcapUserInfo, res) => {
  const csvStream = csv.format({ headers: true });
  csvStream.pipe(res);

  await generateProgramMonitoringReport(csvStream);

  logger.info({
    action: 'program-monitoring-report-csv',
    performed_by: {
      username: user.username,
      id: user.id,
    },
  });
  csvStream.end();
};

router.get(
  '/csv/monitoring',
  [keycloak.allowRolesMiddleware(Role.MinistryOfHealth)],
  asyncMiddleware(async (req, res) => {
    const { hcapUserInfo: user } = req;
    res.attachment('report.csv');

    await generateReport(user, res);
  })
);

export default router;
