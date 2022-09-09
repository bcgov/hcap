import React, { lazy, useEffect, useState, useMemo } from 'react';
import { Card, Page, CheckPermissions, Dialog } from '../../components/generic';
import Button from '@material-ui/core/Button';
import { Box, Grid, Link, Typography, makeStyles } from '@material-ui/core';
import { scrollUp } from '../../utils';
import routes from '../../constants/routes';
import { PSIForm, CohortForm } from '../../components/modal-forms';
import { useToast } from '../../hooks';
import { ToastStatus, NewCohortSchema } from '../../constants';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import MuiAlert from '@material-ui/lab/Alert';

import { fetchPSI, fetchCohorts, addCohort, editCohort } from '../../services';

const CohortTable = lazy(() => import('./CohortTable'));

// Style
// Custom style
const customStyle = makeStyles({
  rootContainer: {
    flexGrow: 1,
  },
  cardRoot: {
    minWidth: '1020px',
  },
});

// Service layer

export default ({ match }) => {
  // States and params
  const { openToast } = useToast();
  const [psi, setPSI] = useState({});
  const [cohorts, setCohorts] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [activeModalForm, setActiveModalForm] = useState(null);
  const psiID = parseInt(match.params.id, 10);
  const [error, setError] = useState(null);
  const [cohort, setCohort] = useState(null);

  // Style classes
  const classes = customStyle();

  // Tiny internal hook
  const usePSIDetails = () => {
    const { id, ...rest } = psi;
    return rest;
  };

  // Memo stats
  const openCohorts = useMemo(
    () =>
      cohorts.filter(
        (cohort) =>
          cohort.cohort_size - cohort.participants.length > 0 &&
          new Date(cohort.end_date) > new Date()
      ).length,
    [cohorts]
  );

  const closedCohorts = useMemo(() => cohorts.length - openCohorts, [cohorts, openCohorts]);

  // Actions
  const handleManagePSIClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (event) => {
    setAnchorEl(null);
  };

  const closeModal = () => {
    setCohort(null);
    setActiveModalForm(null);
  };

  const handlePSIEdit = async ([success, errorText]) => {
    if (success) {
      closeModal();
      openToast({
        status: ToastStatus.SUCCESS,
        message: 'PSI updated successfully',
      });
      const updatedPSI = await fetchPSI({ psiId: psiID });
      setPSI(updatedPSI);
    } else {
      openToast({
        status: ToastStatus.Error,
        message: errorText,
      });
    }
  };

  const handleAddCohort = async (cohort) => {
    try {
      await addCohort({ cohort, psiId: psiID });
      setActiveModalForm(null);
      openToast({
        status: ToastStatus.Success,
        message: `Cohort '${cohort.cohortName}' added successfully`,
      });
      const cohorts = await fetchCohorts({ psiId: psiID });
      setCohorts(cohorts);
    } catch (error) {
      openToast({
        status: ToastStatus.Error,
        message: error.message || 'Unable to add cohort',
      });
    }
  };

  const handleCohortEdit = async (newCohort) => {
    try {
      await editCohort({ cohort: newCohort, cohortId: cohort.id });

      openToast({
        status: ToastStatus.Success,
        message: `Cohort '${newCohort.cohortName}' (#${cohort.id}) updated successfully`,
      });
      setActiveModalForm(null);
      setCohort(null);
      const cohorts = await fetchCohorts({ psiId: psiID });
      setCohorts(cohorts);
    } catch (error) {
      openToast({
        status: ToastStatus.Error,
        message: error.message || 'Unable to add cohort',
      });
    }
  };

  const displayEditCohortModal = async (cohort) => {
    setActiveModalForm('show-cohort');
    setCohort(cohort);
  };

  // Lifecycle Hooks
  useEffect(() => {
    fetchPSI({ psiId: psiID })
      .then((psiData) => {
        setPSI(psiData);
        fetchCohorts({ psiId: psiID })
          .then((cohortsData) => {
            setCohorts(cohortsData);
          })
          .catch((error) => {
            setError(error);
          });
      })
      .catch((error) => {
        setError(error);
      });
  }, [psiID, setPSI, setCohorts, setError]);

  scrollUp();
  return (
    <Page>
      <Dialog
        title={
          activeModalForm === 'edit-psi'
            ? `Edit PSI (${psi.instituteName})`
            : cohort
            ? `Edit Cohort (${cohort.cohort_name})`
            : 'Create New Cohort'
        }
        open={activeModalForm != null}
        onClose={closeModal}
      >
        {activeModalForm === 'edit-psi' && (
          <PSIForm
            initialValues={usePSIDetails()}
            onSubmit={(result) => {
              handlePSIEdit(result);
            }}
            onClose={closeModal}
            id={psiID}
          />
        )}
        {activeModalForm === 'show-cohort' && (
          <CohortForm
            cohort={cohort}
            schema={NewCohortSchema}
            onSubmit={(values) => {
              if (cohort) {
                handleCohortEdit({
                  ...values,
                });
              } else {
                handleAddCohort({
                  ...values,
                  psiID,
                });
              }
            }}
            onClose={closeModal}
          />
        )}
      </Dialog>
      <CheckPermissions
        permittedRoles={['ministry_of_health', 'health_authority']}
        renderErrorMessage={true}
      >
        {error && <MuiAlert severity='error'>{error}</MuiAlert>}
        <Card className={classes.cardRoot}>
          <Box pt={4} pb={2} pl={4} pr={4}>
            <Box pb={4} pl={2}>
              <Box pb={2}>
                <Typography variant='body1'>
                  <Link href={routes.PSIView}>PSI</Link> / {psi.instituteName}
                </Typography>
              </Box>
              <Grid container direction='row'>
                <Typography variant='h2'>{psi.instituteName}</Typography>
                <CheckPermissions permittedRoles={['ministry_of_health', 'health_authority']}>
                  <Box pl={2} pt={0.5}>
                    <Button
                      onClick={handleManagePSIClick}
                      variant='outlined'
                      fullWidth={false}
                      size='medium'
                    >
                      <Typography>Manage</Typography>
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
                          setActiveModalForm('edit-psi');
                          handleClose();
                        }}
                      >
                        Edit
                      </MenuItem>
                      <MenuItem
                        onClick={() => {
                          setActiveModalForm('show-cohort');
                          handleClose();
                        }}
                      >
                        Add Cohort
                      </MenuItem>
                    </Menu>
                  </Box>
                </CheckPermissions>
              </Grid>
              <br />
              <Box pt={4} pb={2} pl={4} pr={4} width='100%'>
                <Grid className={classes.rootContainer} container spacing={2}>
                  {/* Street Address */}
                  <Grid item xs={12} sm={6} xl={3}>
                    <Grid item xs={6}>
                      <Typography variant='body1'>
                        <b>Street Address</b>
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography test-id='psi-details-view-addr' variant='body1'>
                        {psi.streetAddress || 'Not Provided'}
                      </Typography>
                    </Grid>
                  </Grid>
                  {/* City */}
                  <Grid item xs={12} sm={6} xl={3}>
                    <Grid item xs={6}>
                      <Typography variant='body1'>
                        <b>City</b>
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography test-id='psi-details-view-city' variant='body1'>
                        {psi.city || 'Not Provided'}
                      </Typography>
                    </Grid>
                  </Grid>
                  {/* Postal Code */}
                  <Grid item xs={12} sm={6} xl={3}>
                    <Grid item xs={6}>
                      <Typography variant='body1'>
                        <b>Postal Code</b>
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography test-id='psi-details-view-postal' variant='body1'>
                        {psi.postalCode}
                      </Typography>
                    </Grid>
                  </Grid>
                  {/* Health Authority */}
                  <Grid item xs={12} sm={6} xl={3}>
                    <Grid item xs={6}>
                      <Typography variant='body1'>
                        <b>Health Authority</b>
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography test-id='psi-details-view-ha' variant='body1'>
                        {psi.healthAuthority || 'Not Provided'}
                      </Typography>
                    </Grid>
                  </Grid>
                  {/* Total Cohorts */}
                  <Grid item xs={12} sm={6} xl={3}>
                    <Grid item xs={6}>
                      <Typography variant='body1'>
                        <b>Total Cohorts</b>
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography test-id='psi-details-view-total-cohort' variant='body1'>
                        {cohorts.length}
                      </Typography>
                    </Grid>
                  </Grid>
                  {/* Open Cohorts */}
                  <Grid item xs={12} sm={6} xl={3}>
                    <Grid item xs={6}>
                      <Typography variant='body1'>
                        <b>Open Cohorts</b>
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography test-id='psi-details-view-open-cohort' variant='body1'>
                        {openCohorts}
                      </Typography>
                    </Grid>
                  </Grid>
                  {/* Closed Cohorts */}
                  <Grid item xs={12} sm={6} xl={3}>
                    <Grid item xs={6}>
                      <Typography variant='body1'>
                        <b>Closed Cohorts</b>
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography test-id='psi-details-view-closed-cohort' variant='body1'>
                        {closedCohorts}
                      </Typography>
                    </Grid>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Box>
          {cohorts.length > 0 ? (
            <CohortTable cohorts={cohorts} editCohortAction={displayEditCohortModal} />
          ) : (
            <Typography variant='h5' align='center'>
              No Cohorts Added
            </Typography>
          )}
        </Card>
      </CheckPermissions>
    </Page>
  );
};
