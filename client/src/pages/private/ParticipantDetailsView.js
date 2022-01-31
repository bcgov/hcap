// Participant Details Page
// Dependency
import pick from 'lodash/pick';
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import { Box, Card, Grid, Link, Typography, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';

// Libs
import { useToast } from '../../hooks';
import { AuthContext } from '../../providers';
import { Page, CheckPermissions, Alert, Dialog } from '../../components/generic';
import { EditParticipantFormSchema, ToastStatus } from '../../constants';
import { EditParticipantForm } from '../../components/modal-forms';
import {
  updateParticipant,
  fetchParticipant,
  psi,
  assignParticipantWithCohort,
} from '../../services';

// Sub component
import { PSICohortView } from '../../components/participant-details';

// Key Map
const keyLabelMap = {
  fullName: 'Full Name',
  phoneNumber: 'Phone Number',
  emailAddress: 'Email Address',
  interested: 'Program Interest',
  preferredLocation: 'Preferred Location',
  postalCodeFsa: 'Postal Code FSA',
  cohortName: 'Cohort / PSI',
};

// Display Data
const displayData = (inputData) => ({
  ...pick(inputData, Object.keys(keyLabelMap)),
  fullName: `${inputData.firstName} ${inputData.lastName}`,
  interested:
    inputData.interested === 'yes'
      ? 'Interested'
      : inputData.interested === 'no'
      ? 'Withdrawn'
      : inputData.interested,
});

// Custom style
const customStyle = makeStyles({
  rootContainer: {
    flexGrow: 1,
  },
});

// Helper
const fetchData = ({
  setParticipant,
  setActualParticipant,
  setPSIList,
  id,
  setError,
  setDisableAssign,
}) => {
  fetchParticipant({ id })
    .then((resp) => {
      setParticipant(displayData(resp));
      setActualParticipant(resp);
      if (
        resp.interested?.toLowerCase() === 'withdrawn' ||
        resp.interested?.toLowerCase() === 'no'
      ) {
        setDisableAssign(true);
        return;
      }

      psi()
        .then((list) => {
          setPSIList(list);
        })
        .catch((err) => {
          setError(`${err}`);
        });
    })
    .catch((err) => {
      setError(`${err}`);
    });
};

// Get Cohort name
const cohortName = (cohort) => `${cohort.cohort_name} / ${cohort.psi?.institute_name}`;

export default () => {
  // History
  const history = useHistory();
  // State
  const [error, setError] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [actualParticipant, setActualParticipant] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [psiList, setPSIList] = useState([]);
  const [disableAssign, setDisableAssign] = useState(false);
  const [selectedCohort, setSelectedCohort] = useState(null);
  // Hook: Toast
  const { openToast } = useToast();
  // Auth context
  const { auth } = AuthContext.useAuth();
  // Memo roles
  const roles = useMemo(() => auth.user?.roles || [], [auth.user?.roles]);
  // Style classes
  const classes = customStyle();
  // Get param
  const { id, page } = useParams();
  // Breadcrumb name
  const linkName = page === 'participant' ? 'Participant' : 'Site View';
  // Edit Button flag
  const enableEdit = roles.some((role) => ['ministry_of_health', 'superuser'].includes(role));

  // UI Actions
  // 1. Show edit
  const showEditInfoModal = async () => setShowEditModal(true);
  // 2. Update Info
  const onUpdateInfo = async (values) => {
    setShowEditModal(false);
    try {
      const [updatedParticipant] = await updateParticipant(values, { ...actualParticipant });
      const mergedParticipant = { ...actualParticipant, ...updatedParticipant };
      setParticipant(displayData(mergedParticipant));
      setActualParticipant(mergedParticipant);
      openToast({
        status: ToastStatus.Info,
        message: `${participant.fullName} is successfully updated`,
      });
    } catch (err) {
      setError(`${err}`);
    }
  };

  const callAssignCohort = async (cohort) => {
    try {
      await assignParticipantWithCohort({ participantId: id, cohortId: cohort.id });
      openToast({
        status: ToastStatus.Success,
        message: `Participant is assigned to ${cohort.cohort_name}.`,
      });
      fetchData({
        setParticipant,
        setPSIList,
        setActualParticipant,
        setError,
        setDisableAssign,
        id,
      });
    } catch (error) {
      openToast({
        status: ToastStatus.Error,
        message: `${error}`,
      });
    }
  };

  // Confirmation Close
  const onClose = () => {
    setSelectedCohort(null);
  };

  // Rendering Hook
  useEffect(() => {
    fetchData({ setParticipant, setPSIList, setActualParticipant, setDisableAssign, setError, id });
  }, [setParticipant, setPSIList, setActualParticipant, setError, setDisableAssign, id]);

  // Render
  return (
    <Page isAutoHeight={true}>
      <CheckPermissions
        permittedRoles={['employer', 'health_authority', 'ministry_of_health']}
        renderErrorMessage={true}
      >
        {error && <Alert severity='error'>{error}</Alert>}
        {!participant && !error && <Alert severity='info'>Loading participant details</Alert>}
        {participant && (
          <Card>
            {selectedCohort !== null && (
              <Dialog
                showDivider={true}
                title='Assign Cohort'
                open={selectedCohort !== null}
                onClose={onClose}
              >
                <DialogContent>
                  <Grid container spacing={4}>
                    <Grid item xs={12}>
                      <Grid container spacing={1}>
                        <Grid item xs={4}>
                          <Typography variant='body1'>Participant Name</Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant='body2'>{participant.fullName}</Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                    <Grid item xs={12}>
                      <Grid container spacing={1}>
                        <Grid item xs={4}>
                          <Typography variant='body1'>Assign Cohort</Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Typography variant='body2'>{cohortName(selectedCohort)}</Typography>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Grid>
                  <br />
                  <Box>
                    <Typography variant='body2'>
                      Are you sure that you would like to assign this participant to{' '}
                      <b>{cohortName(selectedCohort)}</b>.? Please review the above information
                      before proceeding.
                    </Typography>
                  </Box>
                </DialogContent>
                <DialogActions>
                  <Button variant='outlined' onClick={onClose} color='primary'>
                    Cancel
                  </Button>
                  <Button
                    variant='contained'
                    onClick={() => {
                      callAssignCohort({ ...selectedCohort });
                      onClose();
                    }}
                    color='primary'
                  >
                    Assign
                  </Button>
                </DialogActions>
              </Dialog>
            )}
            <Box pt={4} pb={2} pl={4} pr={4}>
              <Box pb={4} pl={2}>
                <Box pb={2}>
                  <Typography variant='body1'>
                    <Link
                      onClick={() => {
                        history.goBack();
                      }}
                    >
                      {linkName}
                    </Link>{' '}
                    /{participant.fullName}
                  </Typography>
                </Box>
                <Grid container>
                  <Typography variant='h2'>
                    <b>Participant Details</b>
                  </Typography>
                </Grid>
              </Box>
            </Box>
            <Box pt={4} pb={2} pl={4} pr={4} width='100%'>
              <Grid className={classes.rootContainer} container spacing={2}>
                {Object.keys(keyLabelMap).map((key) => (
                  <Grid key={key} item xs={12} sm={6} xl={3}>
                    <Grid item xs={6}>
                      <Typography variant='body1'>
                        <b>{keyLabelMap[key]}</b>
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant='body1'>{participant[key]}</Typography>
                    </Grid>
                  </Grid>
                ))}
              </Grid>
            </Box>
            <Grid container style={{ marginBottom: '10px', marginLeft: '10px' }}>
              <Grid item xs={4}>
                <Button variant='outlined' disabled={!enableEdit} onClick={showEditInfoModal}>
                  Edit Info
                </Button>
              </Grid>
            </Grid>
            <CheckPermissions permittedRoles={['health_authority']}>
              {!disableAssign && (
                <PSICohortView
                  psiList={psiList}
                  assignAction={(cohort) => setSelectedCohort(cohort)}
                  participant={actualParticipant}
                />
              )}
            </CheckPermissions>
          </Card>
        )}
      </CheckPermissions>
      <>
        {showEditModal && actualParticipant && (
          <Dialog
            title='Edit Participant Info'
            open={showEditModal}
            onClose={() => setShowEditModal(false)}
          >
            <EditParticipantForm
              initialValues={actualParticipant}
              validationSchema={EditParticipantFormSchema}
              onSubmit={onUpdateInfo}
              onClose={() => {
                setShowEditModal(false);
                fetchData({
                  setParticipant,
                  setPSIList,
                  setActualParticipant,
                  setDisableAssign,
                  setError,
                  id,
                });
              }}
            />
          </Dialog>
        )}
      </>
    </Page>
  );
};
