/* eslint-disable */
import React, { useEffect, useState, useMemo } from 'react';
import { Box, Container, Typography, List, ListItem, ListItemText } from '@material-ui/core';
import store from 'store';

import { Page, Card, CheckPermissions, Button } from '../../components/generic';
import { API_URL } from '../../constants';
import { AuthContext } from '../../providers';
import { useToast } from '../../hooks';
import { handleReportDownloadResult } from '../../utils';
import { fetchMilestoneReports, downloadReport } from '../../services/reports';

export default () => {
  const { openToast } = useToast();
  const { auth } = AuthContext.useAuth();
  const roles = useMemo(() => auth.user?.roles || [], [auth.user?.roles]);

  const isMoH = roles.includes('ministry_of_health');
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

  const [isLoadingHiringReport, setLoadingHiringReport] = useState(false);
  const [isLoadingRosReport, setLoadingRosReport] = useState(false);
  // const [isLoadingReport, setLoadingReport] = useState(false);

  const fetchReport = async () => {
    const results = await fetchMilestoneReports();

    if (results) {
      setReport(results.data);
    }
  };

  const handleDownloadReport = async (reportType) => {
    setLoadingHiringReport(true);
    const response = await downloadReport(reportType);
    openToast(response);

    setLoadingHiringReport(false);
  };

  const handleDownloadHiringReportClick = async (reportType) => {
    setLoadingHiringReport(true);
    const response = await downloadReport(reportType);
    openToast(downloadRes);

    setLoadingHiringReport(false);
  };

  const handleDownloadRosReportClick = async () => {
    setLoadingRosReport(true);
    const response = await fetch(`${API_URL}/api/v1/milestone-report/csv/ros`, {
      headers: {
        Authorization: `Bearer ${store.get('TOKEN')}`,
      },
      method: 'GET',
    });

    const downloadRes = await handleReportDownloadResult(
      response,
      `return-of-service-milestones-${new Date().toJSON()}.csv`
    );
    openToast(downloadRes);

    setLoadingRosReport(false);
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
                loading={isLoadingHiringReport}
                onClick={() => handleDownloadReport('hired')}
                text='Download hiring report'
              />
            </Box>
            <Box py={1} display='flex' justifyContent='center'>
              <Button
                fullWidth={false}
                loading={isLoadingRosReport}
                onClick={() => handleDownloadReport('ros')}
                text='Download return of service milestones report'
              />
            </Box>
            <Box py={1} display='flex' justifyContent='center'>
              <Button
                fullWidth={false}
                loading={isLoadingRosReport}
                onClick={() => handleDownloadReport('participants')}
                text='Download participants attending PSI report'
              />
            </Box>
          </Box>
        </Container>
      </CheckPermissions>
    </Page>
  );
};
