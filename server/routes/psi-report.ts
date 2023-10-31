import express from 'express';
import * as csv from 'fast-csv';
import keycloak from '../keycloak';
import logger from '../logger';

import { asyncMiddleware } from '../error-handler';
import { getPSIPaticipantsReport } from '../services/reporting';
import { DEFAULT_REGION_NAME, Role } from '../constants';

const router = express.Router();

router.use(keycloak.getUserInfoMiddleware());

// download report for participants attending PSI
router.get(
  '/csv/participants',
  [keycloak.allowRolesMiddleware(Role.MinistryOfHealth, Role.HealthAuthority)],
  asyncMiddleware(async (req, res) => {
    const { hcapUserInfo: user } = req;
    const isMoh = user.isMoH;
    const region = isMoh ? DEFAULT_REGION_NAME : user.regions[0];
    res.attachment('report.csv');

    if (!user) {
      return res.status(403).json({ error: 'User not found.' });
    }

    const csvStream = csv.format({ headers: true });
    csvStream.pipe(res);

    const results = await getPSIPaticipantsReport(region);
    results.forEach((result) => {
      csvStream.write({
        'Participant ID': result.participantId,
        'First Name': result.firstName,
        'Last Name': result.lastName,
        Pathway: result.program,
        PSI: result.psi,
        'PSI region': result.psiRegion,
        Cohort: result.cohort,
        'Cohort Start Date': result.startDate,
        'Cohort End Date': result.endDate,
        'Graduation Status': result.graduation,
        'Failed/Graduated Date': result.graduationDate,
        'Intent to return': result.isReturning,
      });
    });

    logger.info({
      action: `report-csv-participants-psi`,
      performed_by: {
        username: user.username,
        id: user.id,
      },
    });
    csvStream.end();

    return res.status(200);
  })
);

export default router;
