import React, { useEffect, useState } from 'react';
import Grid from '@material-ui/core/Grid';
import { Box, Typography } from '@material-ui/core';
import store from 'store';
import { Page, CheckPermissions } from '../../components/generic';

export default () => {

  const [roles, setRoles] = useState([]);
  const [isLoadingUser, setLoadingUser] = useState(false);
  const [report, setReport] = useState({ 'total': 0, 'qualified': 0, 'inProgress': 0, 'hired': 0, 'hiredPerRegion': {} });

  const fetchUserInfo = async () => {
    setLoadingUser(true);
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/user`, {
      headers: {
        'Authorization': `Bearer ${store.get('TOKEN')}`,
      },
      method: 'GET',
    });

    if (response.ok) {
      const { roles } = await response.json();
      setLoadingUser(false);
      setRoles(roles);
    }
  }


  const fetchReport = async () => {
    const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/milestone-report`, {
      headers: {
        'Authorization': `Bearer ${store.get('TOKEN')}`,
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
  }

  useEffect(() => {
    fetchUserInfo();
    fetchReport();
  }, []);

  return (
    <Page>
      <CheckPermissions isLoading={isLoadingUser} roles={roles} permittedRoles={['ministry_of_health']} renderErrorMessage={true}>
        <Grid container alignContent="center" justify="center" alignItems="center" direction="column">
          <Box width={0.6} py={4} px={2}>
            <Typography variant="subtitle1" gutterBottom>
              Milestone Reporting
            </Typography>
            <Grid container spacing={3} direction="row">
              <Grid item xs={3}>
                <Typography variant="h4">
                  {report.total}
                </Typography>
                Total Participants
              </Grid>
              <Grid item xs={3}>
                <Typography variant="h4">
                  {report.qualified}
                </Typography>
                Qualified
              </Grid>
              <Grid item xs={3}>
                <Typography variant="h4">
                  {report.inProgress}
                </Typography>
                In Progress
              </Grid>
              <Grid item xs={3}>
                <Typography variant="h4">
                  {report.hired}
                </Typography>
                Participants Hired
              </Grid>
            </Grid>
          </Box>
          <Box width={0.6} py={4} px={2}>
            <Typography variant="subtitle1" gutterBottom>
              Hired Per Region
            </Typography>
            <ul>
              {Object.keys(report.hiredPerRegion).map((k) => <li>{k}: {report.hiredPerRegion[k]}</li>)}
            </ul>
          </Box>
        </Grid>
      </CheckPermissions>
    </Page>
  );
};
