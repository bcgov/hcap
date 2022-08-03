import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, List, ListItem, ListItemText } from '@material-ui/core';
import store from 'store';

import { Page, Card, CheckPermissions, Button } from '../../components/generic';
import { API_URL } from '../../constants';
import { useToast } from '../../hooks';
import { onReportDownloadResult } from '../../utils';

export default () => {
  const { openToast } = useToast();
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

  const fetchReport = async () => {
    const response = await fetch(`${API_URL}/api/v1/milestone-report`, {
      headers: {
        Authorization: `Bearer ${store.get('TOKEN')}`,
      },
      method: 'GET',
    });

    if (response.ok) {
      const results = await response.json();
      setReport({
        total: results.data.total,
        qualified: results.data.qualified,
        inProgress: results.data.inProgress,
        hired: results.data.hired,
        hiredPerRegion: results.data.hiredPerRegion,
      });
    }
  };

  const handleDownloadHiringReportClick = async () => {
    setLoadingHiringReport(true);
    const response = await fetch(`${API_URL}/api/v1/milestone-report/csv/hired`, {
      headers: {
        Authorization: `Bearer ${store.get('TOKEN')}`,
      },
      method: 'GET',
    });

    const downloadRes = await onReportDownloadResult(
      response,
      `participant-stats-hired-${new Date().toJSON()}.csv`
    );
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

    const downloadRes = await onReportDownloadResult(
      response,
      `return-of-service-milestones-${new Date().toJSON()}.csv`
    );
    openToast(downloadRes);

    setLoadingRosReport(false);
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <Page>
      <CheckPermissions permittedRoles={['ministry_of_health']} renderErrorMessage={true}>
        <Container maxWidth='md'>
          <Box py={6}>
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

            <Box py={1} display='flex' justifyContent='center'>
              <Button
                fullWidth={false}
                loading={isLoadingHiringReport}
                onClick={handleDownloadHiringReportClick}
                text='Download hiring report'
              />
            </Box>
            <Box py={1} display='flex' justifyContent='center'>
              <Button
                fullWidth={false}
                loading={isLoadingRosReport}
                onClick={handleDownloadRosReportClick}
                text='Download return of service milestones report'
              />
            </Box>
          </Box>
        </Container>
      </CheckPermissions>
    </Page>
  );
};
