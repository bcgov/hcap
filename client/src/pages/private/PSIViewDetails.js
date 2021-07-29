import React, { lazy, useEffect, useState } from 'react';
import { Card, Page, CheckPermissions, Dialog } from '../../components/generic';
import Button from '@material-ui/core/Button';
import { Box, Grid, Link, Typography } from '@material-ui/core';
import { scrollUp } from '../../utils';
import store from 'store';
import routes from '../../constants/routes';
import { EditPSIForm, NewCohortForm } from '../../components/modal-forms';
import { useToast } from '../../hooks';
import { ToastStatus, EditPSISchema, NewCohortSchema, API_URL } from '../../constants';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';

const CohortTable = lazy(() => import('./CohortTable'));

export default ({ match }) => {
  const { openToast } = useToast();
  const [psi, setPSI] = useState({});
  const [cohorts, setCohorts] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeModalForm, setActiveModalForm] = useState(null);
  const psiID = parseInt(match.params.id, 10);

  const handleManagePSIClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (event) => {
    setAnchorEl(null);
  };

  const closeModal = () => {
    setActiveModalForm(null);
  };

  const handlePSIEdit = async (psi) => {
    console.log('TODO: handle PSI Patch');
    // const response = await fetch(`${API_URL}/api/v1/${psiID}`, {
    //   method: 'PATCH',
    //   headers: {
    //     Authorization: `Bearer ${store.get('TOKEN')}`,
    //     Accept: 'application/json',
    //     'Content-type': 'application/json',
    //   },
    //   body: JSON.stringify(psi),
    // });

    // if (response.ok) {
    //   setActiveModalForm(null);
    //   fetchPSI(psiID);
    // } else {
    //   openToast({
    //     status: ToastStatus.Error,
    //     message: response.error || response.statusText || 'Server error',
    //   });
    // }
  };

  const handleAddCohort = async (cohort) => {
    const response = await fetch(`${API_URL}/api/v1/psi/${psiID}/cohorts/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${store.get('TOKEN')}`,
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify(cohort),
    });

    if (response.ok) {
      setActiveModalForm(null);
      fetchPSI(psiID);
      fetchCohorts(psiID);
    } else {
      openToast({
        status: ToastStatus.Error,
        message: response.error || response.statusText || 'Server error',
      });
    }
  };

  const fetchPSI = async (psiID) => {
    const response = await fetch(`${API_URL}/api/v1/psi/${psiID}`, {
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
    }
  };

  const fetchCohorts = async (psiID) => {
    const response = await fetch(`${API_URL}/api/v1/psi/${psiID}/cohorts/`, {
      headers: {
        Authorization: `Bearer ${store.get('TOKEN')}`,
      },
      method: 'GET',
    });

    if (response.ok) {
      const cohortList = await response.json();
      setCohorts(cohortList);
    }
  };

  useEffect(() => {
    fetchPSI(psiID);
    fetchCohorts(psiID);
  }, [psiID]);

  scrollUp();
  return (
    <>
      <Dialog
        title={
          activeModalForm === 'edit-psi' ? `Edit PSI (${psi.instituteName})` : `Create New Cohort`
        }
        open={activeModalForm != null}
        onClose={closeModal}
      >
        {activeModalForm === 'edit-psi' && (
          <EditPSIForm
            initialValues={psi}
            validationSchema={EditPSISchema}
            onSubmit={(values) => {
              // const history = {
              //   timestamp: new Date(),
              //   changes: [],
              // };
              // Object.keys(values).forEach((key) => {
              //   if (values[key] !== psi[key]) {
              //     history.changes.push({
              //       field: key,
              //       from: psi[key],
              //       to: values[key],
              //     });
              //   }
              // });
              handlePSIEdit({
                // siteContactFirstName: values.siteContactFirstName,
                // siteContactLastName: values.siteContactLastName,
                // siteContactPhone: values.siteContactPhone,
                // siteContactEmail: values.siteContactEmail,
                // siteName: values.siteName,
                // registeredBusinessName: values.registeredBusinessName,
                // address: values.address,
                // city: values.city,
                // isRHO: values.isRHO,
                // postalCode: values.postalCode,
                // allocation: values.allocation,
                // operatorContactFirstName: values.operatorContactFirstName,
                // operatorContactLastName: values.operatorContactLastName,
                // operatorPhone: values.operatorPhone,
                // operatorEmail: values.operatorEmail,
                // history: site.history ? [history, ...site.history] : [history],
              });
            }}
            onClose={closeModal}
          />
        )}
        {activeModalForm === 'add-cohort' && (
          <NewCohortForm
            initialValues={{}}
            validationSchema={NewCohortSchema}
            onSubmit={(values) => {
              handleAddCohort({
                ...values,
                psiID,
              });
            }}
            onClose={closeModal}
          />
        )}
      </Dialog>
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
                        <MenuItem
                          onClick={() => {
                            setActiveModalForm('add-cohort');
                            handleClose();
                          }}
                        >
                          Add Cohort
                        </MenuItem>
                        <MenuItem
                          onClick={() => {
                            setActiveModalForm('edit-psi');
                            handleClose();
                          }}
                        >
                          Edit PSI Info
                        </MenuItem>
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

                    {/* Total Cohorts */}
                    <Typography>{cohorts.length}</Typography>

                    {/* Open Cohorts have less participants than their size */}
                    <Typography>
                      {
                        cohorts.filter(
                          (cohort) => cohort.cohort_size - cohort.participants.length > 0
                        ).length
                      }
                    </Typography>

                    {/* Closed Cohorts have equal participants to their size */}
                    <Typography>
                      {
                        cohorts.filter(
                          (cohort) => cohort.cohort_size - cohort.participants.length === 0
                        ).length
                      }
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            </Box>
            {cohorts.length > 0 ? (
              <CohortTable cohorts={cohorts} />
            ) : (
              <Typography variant='h5' align='center'>
                No Cohorts Added
              </Typography>
            )}
          </Card>
        </CheckPermissions>
      </Page>
    </>
  );
};
