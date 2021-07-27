import React, { lazy, useEffect, useState } from 'react';
import { Card, Page, CheckPermissions } from '../../components/generic';
import Button from '@material-ui/core/Button';
import { Box, Grid, Link, Typography } from '@material-ui/core';
import { scrollUp } from '../../utils';
import store from 'store';
import routes from '../../constants/routes';
import { API_URL } from '../../constants';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

const CohortTable = lazy(() => import('./CohortTable'));

export default ({ match }) => {
  const [psi, setPSI] = useState({});
  const [cohorts, setCohorts] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const id = match.params.id;

  const handleManagePSIClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (event) => {
    setAnchorEl(null);
  };

  const fetchPSI = async (id) => {
    const response = await fetch(`${API_URL}/api/v1/psi/${id}`, {
      headers: {
        Authorization: `Bearer ${store.get('TOKEN')}`,
      },
      method: 'GET',
    });

    if (response.ok) {
      const psi = await response.json();
      setPSI({
        id: psi.id,
        instituteName: psi.institute_name,
        healthAuthority: psi.health_authority,
        streetAddress: psi.street_address,
        postalCode: psi.postal_code,
        city: psi.city,
      });

      // TODO: get cohorts
      setCohorts([]);
    }
  };

  useEffect(() => {
    fetchPSI(id);
  }, [id]);

  scrollUp();
  return (
    <Page>
      <CheckPermissions permittedRoles={['ministry_of_health']} renderErrorMessage={true}>
        <Card>
          <Box pt={4} pb={2} pl={4} pr={4}>
            <Box pb={4} pl={2}>
              <Box pb={2}>
                <Typography variant='body1'>
                  <Link href={routes.PSIView}>PSI</Link> / {psi.instituteName}
                </Typography>
              </Box>
              <Grid container direction='row' xs={12}>
                <Typography variant='h2'>
                  <b>{psi.instituteName}</b>
                </Typography>
                <CheckPermissions permittedRoles={['ministry_of_health']}>
                  <Box pl={2} pt={0.5}>
                    <Button
                      onClick={handleManagePSIClick}
                      variant='outlined'
                      fullWidth={false}
                      size='medium'
                    >
                      <Typography>Manage PSI</Typography>
                      <KeyboardArrowDownIcon />
                    </Button>
                    <Menu
                      id='managePSIMenu'
                      anchorEl={anchorEl}
                      keepMounted
                      open={Boolean(anchorEl)}
                      onClose={handleClose}
                    >
                      <MenuItem onClick={handleClose}>Add Cohort</MenuItem>
                      <MenuItem onClick={handleClose}>Edit PSI Info</MenuItem>
                    </Menu>
                  </Box>
                </CheckPermissions>
              </Grid>
              <br />
              <Typography variant='h4' mt={10}>
                PSI Info
              </Typography>
              <Grid container direction='row' xs={12} sm={9} md={6}>
                <Grid container item direction='column' xs={6}>
                  <Typography>
                    <b>Street Address: </b>
                  </Typography>
                  <Typography>
                    <b>City: </b>
                  </Typography>
                  <Typography>
                    <b>Postal Code: </b>
                  </Typography>
                  <Typography>
                    <b>Total Cohorts: </b>
                  </Typography>
                  <Typography>
                    <b>Open Cohorts: </b>
                  </Typography>
                  <Typography>
                    <b>Closed Cohorts: </b>
                  </Typography>
                </Grid>
                <Grid container item direction='column' xs={6}>
                  <Typography>{psi.streetAddress}</Typography>
                  <Typography>{psi.city}</Typography>
                  <Typography>{psi.postalCode}</Typography>

                  {/* This will be calculated in more detail later */}
                  <Typography>{cohorts.length}</Typography>
                  <Typography>{cohorts.length}</Typography>
                  <Typography>{cohorts.length}</Typography>
                </Grid>
              </Grid>
            </Box>
          </Box>
          <CohortTable />
        </Card>
      </CheckPermissions>
    </Page>
  );
};
