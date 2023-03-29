import React, { useEffect, useState, useMemo } from 'react';
import { Box, Container, Typography, List, ListItem, ListItemText } from '@material-ui/core';

import { Page, Card, CheckPermissions, Button } from '../../components/generic';
import { regionLabelsMap } from '../../constants';
import { AuthContext } from '../../providers';
import { useToast } from '../../hooks';
import {
  fetchMilestoneReports,
  downloadMilestoneReports,
  downloadPSIReports,
} from '../../services/reports';

export default () => {
  const { openToast } = useToast();
  const { auth } = AuthContext.useAuth();
  const roles = useMemo(() => auth.user?.roles || [], [auth.user?.roles]);
  const isMoH = roles.includes('ministry_of_health');
  const [HARegion] = roles.map((loc) => regionLabelsMap[loc]).filter(Boolean);

  const reportStats = {
    total: 'Total Participants',
    qualified: 'Qualified',
    inProgress: 'In Progress',
    hired: 'Participants Hired',
  };
  const [report, setReport] = useState({
    total: 0,
    qualified: 0,
    inProgress: 0,
    hired: 0,
    hiredPerRegion: {},
  });

  const [isLoadingReport, setLoadingReport] = useState(null);

  const fetchReport = async () => {
    const results = await fetchMilestoneReports();

    if (results) {
      setReport(results.data);
    }
  };

  const handleDownloadMilestoneReports = async (reportType) => {
    setLoadingReport(reportType);
    const region = isMoH ? null : HARegion;
    const response = await downloadMilestoneReports(reportType, region);
    openToast(response);

    setLoadingReport('');
  };

  const handleDownloadPSIReports = async (reportType) => {
    setLoadingReport(reportType);
    const response = await downloadPSIReports(reportType);
    openToast(response);

    setLoadingReport('');
  };

  useEffect(() => {
    isMoH && fetchReport();
  }, [isMoH]);

  return (
    <Page centered={!isMoH}>
      <CheckPermissions
        permittedRoles={['ministry_of_health', 'health_authority']}
        renderErrorMessage={true}
      >
        <CheckPermissions permittedRoles={['ministry_of_health']}>
          <Container maxWidth='md'>
            <Box py={2}>
              <Typography variant='subtitle1' gutterBottom>
                Milestone Reporting
              </Typography>
              <Box py={2} display='flex' justifyContent='space-between'>
                {Object.keys(reportStats).map((item, ind) => (
                  <Card key={`st_${ind}`}>
                    <Typography variant='h4'>{report[item]}</Typography>
                    <Typography variant='body1'>{reportStats[item]}</Typography>
                  </Card>
                ))}
              </Box>

              <Box py={4}>
                <Typography variant='subtitle1' gutterBottom>
                  Hired Per Region
                </Typography>
                <Box py={2}>
                  <Card noPadding>
                    <List>
                      {Object.keys(report.hiredPerRegion).map((key) => (
                        <ListItem key={key}>
                          <ListItemText primary={`${key}: ${report.hiredPerRegion[key]}`} />
                        </ListItem>
                      ))}
                    </List>
                  </Card>
                </Box>
              </Box>
            </Box>
          </Container>
        </CheckPermissions>

        <Container maxWidth='md'>
          <Box>
            <Box py={1} display='flex' justifyContent='center'>
              <Button
                fullWidth={false}
                loading={isLoadingReport === 'hired'}
                onClick={() => handleDownloadMilestoneReports('hired')}
                text='Download hiring report'
              />
            </Box>
            <Box py={1} display='flex' justifyContent='center'>
              <Button
                fullWidth={false}
                loading={isLoadingReport === 'ros'}
                onClick={() => handleDownloadMilestoneReports('ros')}
                text='Download return of service milestones report'
              />
            </Box>
            <Box py={1} display='flex' justifyContent='center'>
              <Button
                fullWidth={false}
                loading={isLoadingReport === 'psi'}
                onClick={() => handleDownloadPSIReports('psi')}
                text='Download participants attending PSI report'
              />
            </Box>
          </Box>
        </Container>
      </CheckPermissions>
    </Page>
  );
};
