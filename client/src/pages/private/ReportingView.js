import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, List, ListItem, ListItemText } from '@material-ui/core';
import store from 'store';
import { saveAs } from 'file-saver';

import { Page, Card, CheckPermissions, Button } from '../../components/generic';
import { API_URL, ToastStatus } from '../../constants';
import { useToast } from '../../hooks';

export default () => {
  const [isLoading, setLoading] = useState(false);
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

  const handleDownloadHiringClick = async () => {
    setLoading(true);
    const response = await fetch(`${API_URL}/api/v1/milestone-report/csv/hired`, {
      headers: {
        Authorization: `Bearer ${store.get('TOKEN')}`,
      },
      method: 'GET',
    });

    if (response.ok) {
      const blob = await response.blob();
      saveAs(blob, `participant-stats-hired-${new Date().toJSON()}.csv`);
    } else {
      openToast({
        status: ToastStatus.Error,
        message: response.error || response.statusText || 'Error while downloading report',
      });
    }

    setLoading(false);
  };

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

            <Box display='flex' justifyContent='center'>
              <Button
                fullWidth={false}
                loading={isLoading}
                onClick={() => handleDownloadHiringClick()}
                text='Download hiring report (CSV)'
              />
            </Box>
          </Box>
        </Container>
      </CheckPermissions>
    </Page>
  );
};
