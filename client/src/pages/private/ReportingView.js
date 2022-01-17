import React, { useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import { Box, Typography } from '@mui/material';
import store from 'store';
import { saveAs } from 'file-saver';
import { Page, CheckPermissions, Button } from '../../components/generic';
import { API_URL } from '../../constants';

export default () => {
  const [isLoading, setLoading] = useState(false);
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
      setLoading(false);
    }
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
        <Grid
          container
          alignContent='center'
          justifyContent='center'
          alignItems='center'
          direction='column'
        >
          <Box width={0.6} py={4} px={2}>
            <Typography variant='subtitle1' gutterBottom>
              Milestone Reporting
            </Typography>
            <Grid container spacing={3} direction='row'>
              <Grid item xs={3}>
                <Typography variant='h4'>{report.total}</Typography>
                Total Participants
              </Grid>
              <Grid item xs={3}>
                <Typography variant='h4'>{report.qualified}</Typography>
                Qualified
              </Grid>
              <Grid item xs={3}>
                <Typography variant='h4'>{report.inProgress}</Typography>
                In Progress
              </Grid>
              <Grid item xs={3}>
                <Typography variant='h4'>{report.hired}</Typography>
                Participants Hired
              </Grid>
            </Grid>
          </Box>
          <Box width={0.6} py={4} px={2}>
            <Typography variant='subtitle1' gutterBottom>
              Hired Per Region
            </Typography>
            <ul>
              {Object.keys(report.hiredPerRegion).map((k) => (
                <li key={k}>
                  {k}: {report.hiredPerRegion[k]}
                </li>
              ))}
            </ul>
          </Box>
        </Grid>
        <Button
          fullWidth={false}
          loading={isLoading}
          size='small'
          onClick={() => handleDownloadHiringClick()}
          text='Download hiring report (CSV)'
        />
      </CheckPermissions>
    </Page>
  );
};
