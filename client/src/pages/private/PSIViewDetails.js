import React, { lazy, useEffect, useState } from 'react';
import { Card, Dialog, Page, CheckPermissions } from '../../components/generic';
import Button from '@material-ui/core/Button';
import { Box, Chip, Grid, Link, Typography } from '@material-ui/core';
import { scrollUp } from '../../utils';
import store from 'store';
import routes from '../../constants/routes';
import { EditSiteForm } from '../../components/modal-forms';
import { useToast } from '../../hooks';
import { ToastStatus, EditSiteSchema, API_URL } from '../../constants';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

const CohortTable = lazy(() => import('./CohortTable'));

export default ({ match }) => {
  const { openToast } = useToast();
  const [psi, setPSI] = useState({});
  const [cohorts, setCohorts] = useState({});
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeModalForm, setActiveModalForm] = useState(null);
  const id = match.params.id;

  const handleManagePSIClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (event) => {
    setAnchorEl(null);
  };

  const handlePSIEdit = async (psi) => {
    const response = await fetch(`${API_URL}/api/v1/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${store.get('TOKEN')}`,
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify(psi),
    });

    if (response.ok) {
      setActiveModalForm(null);
      fetchPSI(id);
    } else {
      openToast({
        status: ToastStatus.Error,
        message: response.error || response.statusText || 'Server error',
      });
    }
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
    <>
      {/* <Dialog */}
      {/*   title={`Edit PSI (${psi.instituteName})`} */}
      {/*   open={activeModalForm != null} */}
      {/*   onClose={defaultOnClose} */}
      {/* > */}
      {/*   {activeModalForm === 'edit-psi' && ( */}
      {/*     <EditSiteForm */}
      {/*       initialValues={{ */}
      {/*         siteContactFirstName: site.siteContactFirstName, */}
      {/*         siteContactLastName: site.siteContactLastName, */}
      {/*         siteContactPhone: site.siteContactPhone, */}
      {/*         siteContactEmail: site.siteContactEmail, */}
      {/*         siteName: site.siteName, */}
      {/*         registeredBusinessName: site.registeredBusinessName, */}
      {/*         address: site.address, */}
      {/*         city: site.city, */}
      {/*         isRHO: site.isRHO, */}
      {/*         postalCode: site.postalCode, */}
      {/*         allocation: site.allocation, */}
      {/*         operatorContactFirstName: site.operatorContactFirstName, */}
      {/*         operatorContactLastName: site.operatorContactLastName, */}
      {/*         operatorPhone: site.operatorPhone, */}
      {/*         operatorEmail: site.operatorEmail, */}
      {/*       }} */}
      {/*       validationSchema={EditSiteSchema} */}
      {/*       onSubmit={(values) => { */}
      {/*         const history = { */}
      {/*           timestamp: new Date(), */}
      {/*           changes: [], */}
      {/*         }; */}
      {/*         Object.keys(values).forEach((key) => { */}
      {/*           if (values[key] !== site[key]) { */}
      {/*             history.changes.push({ */}
      {/*               field: key, */}
      {/*               from: site[key], */}
      {/*               to: values[key], */}
      {/*             }); */}
      {/*           } */}
      {/*         }); */}
      {/*         handlePSIEdit({ */}
      {/*           siteContactFirstName: values.siteContactFirstName, */}
      {/*           siteContactLastName: values.siteContactLastName, */}
      {/*           siteContactPhone: values.siteContactPhone, */}
      {/*           siteContactEmail: values.siteContactEmail, */}
      {/*           siteName: values.siteName, */}
      {/*           registeredBusinessName: values.registeredBusinessName, */}
      {/*           address: values.address, */}
      {/*           city: values.city, */}
      {/*           isRHO: values.isRHO, */}
      {/*           postalCode: values.postalCode, */}
      {/*           allocation: values.allocation, */}
      {/*           operatorContactFirstName: values.operatorContactFirstName, */}
      {/*           operatorContactLastName: values.operatorContactLastName, */}
      {/*           operatorPhone: values.operatorPhone, */}
      {/*           operatorEmail: values.operatorEmail, */}
      {/*           history: site.history ? [history, ...site.history] : [history], */}
      {/*         }); */}
      {/*       }} */}
      {/*       onClose={defaultOnClose} */}
      {/*     /> */}
      {/*   )} */}
      {/* </Dialog> */}
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
                <Grid container direction='row'>
                  <Typography variant='h2'>
                    <b>{psi.instituteName}</b>
                  </Typography>
                  <CheckPermissions permittedRoles={['ministry_of_health']}>
                    <Box pl={2}>
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
                <Grid container direction='row'>
                  <Grid container item direction='column' xs={3}>
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
    </>
  );
};
