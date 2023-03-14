// Participant Details Page
// Dependency
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';

import { Box, Card, Grid, Link, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import EditIcon from '@material-ui/icons/Edit';

// Libs
import { useToast } from '../../hooks';
import { AuthContext } from '../../providers';
import { Page, CheckPermissions, Alert, Button } from '../../components/generic';
import { ToastStatus, Routes, keyLabelMap, rosKeyMap } from '../../constants';
import {
  assignParticipantWithCohort,
  updateParticipant,
  fetchParticipant,
  getPsi,
  displayParticipantData,
  getParticipantPageLabel,
  updateRosStatus,
} from '../../services';

// Sub components
import {
  AssignCohortSiteDialog,
  EditParticipantDialog,
  PSICohortView,
  EditRosDateDialog,
  EditRosStartDateDialog,
  EditRosSiteDialog,
} from '../../components/participant-details';
import { keyedString } from '../../utils';

const useStyles = makeStyles((theme) => ({
  root: {
    marginBottom: theme.spacing(2),
    padding: theme.spacing(4),
    minWidth: '1020px',
  },
  gridSection: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
}));

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
      setParticipant(displayParticipantData(resp));
      setActualParticipant(resp);
      if (
        resp.interested?.toLowerCase() === 'withdrawn' ||
        resp.interested?.toLowerCase() === 'no'
      ) {
        setDisableAssign(true);
        return;
      }

      getPsi()
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

export default () => {
  // State
  const [error, setError] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [actualParticipant, setActualParticipant] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [psiList, setPSIList] = useState([]);
  const [disableAssign, setDisableAssign] = useState(false);
  const [selectedCohort, setSelectedCohort] = useState(null);
  const [editFormField, setEditFormField] = useState(null);
  // Hook: Toast
  const { openToast } = useToast();
  // Auth context
  const { auth } = AuthContext.useAuth();
  // Memo roles
  const roles = useMemo(() => auth.user?.roles || [], [auth.user?.roles]);
  // Style classes
  const classes = useStyles();
  // Get param
  const { id, page, pageId } = useParams();
  // Breadcrumb name
  const linkName = getParticipantPageLabel(page);

  const isMoH = roles.includes('ministry_of_health');

  // UI Actions
  // 1. Show edit
  const showEditInfoModal = async () => setShowEditModal(true);
  // 2. Update Info
  const onUpdateInfo = async (values) => {
    setShowEditModal(false);
    try {
      const [updatedParticipant] = await updateParticipant(values, { ...actualParticipant });
      const mergedParticipant = { ...actualParticipant, ...updatedParticipant };
      setParticipant(displayParticipantData(mergedParticipant));
      setActualParticipant(mergedParticipant);
      openToast({
        status: ToastStatus.Success,
        message: `${participant.fullName} is successfully updated`,
      });
    } catch (err) {
      setError(`${err}`);
    }
  };
  // close modal
  const handleEditParticipantClose = () => {
    setShowEditModal(false);
    fetchData({
      setParticipant,
      setPSIList,
      setActualParticipant,
      setDisableAssign,
      setError,
      id,
    });
  };

  // Assign a new cohort to a participant
  const handleCallAssignCohort = async (cohort) => {
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
    } catch (err) {
      openToast({
        status: ToastStatus.Error,
        message: `${err}`,
      });
    } finally {
      onAssignCohortClose();
    }
  };

  // Cohort confirmation onClose
  const onAssignCohortClose = () => {
    setSelectedCohort(null);
  };

  // Navigate on link
  const getNavigateBackLink = () => {
    switch (linkName) {
      case 'Participant':
        return Routes.ParticipantView;
      case 'Site View':
        return Routes.SiteView + `/${pageId}`;
      case 'Cohort':
        return keyedString(Routes.CohortDetails, {
          id: pageId,
        });
      default:
        return Routes.ParticipantView;
    }
  };

  // Select which RoS field to edit
  const handleSetEditRosField = (key) => {
    setEditFormField(key);
  };

  // Close Edit RoS window
  const handleEditRosFieldClose = () => {
    setEditFormField(null);
  };

  // Update selected RoS fields
  const handleEditRosField = async (values) => {
    const EDIT_ERROR_MESSAGE = 'Unable to update the field';
    try {
      const response = await updateRosStatus(actualParticipant?.id, values);
      if (response.ok) {
        openToast({
          status: ToastStatus.Success,
          message: `${rosKeyMap[editFormField]?.label} is successfully updated`,
        });
        fetchData({
          setParticipant,
          setPSIList,
          setActualParticipant,
          setDisableAssign,
          setError,
          id,
        });
      } else {
        throw new Error(
          response.message || response.error || response.statusText || EDIT_ERROR_MESSAGE
        );
      }
    } catch (err) {
      openToast({
        status: ToastStatus.Error,
        message: err?.message || EDIT_ERROR_MESSAGE,
      });
    }

    handleEditRosFieldClose();
  };

  // Rendering Hook
  useEffect(() => {
    fetchData({
      setParticipant,
      setPSIList,
      setActualParticipant,
      setDisableAssign,
      setError,
      id,
    });
  }, [setParticipant, setPSIList, setActualParticipant, setError, setDisableAssign, id]);

  // Render
  return (
    <Page>
      <CheckPermissions
        permittedRoles={['employer', 'health_authority', 'ministry_of_health']}
        renderErrorMessage
      >
        {error && <Alert severity='error'>{error}</Alert>}
        {!participant && !error && <Alert severity='info'>Loading participant details</Alert>}
        {participant && (
          <Card className={classes.root}>
            <AssignCohortSiteDialog
              isOpen={selectedCohort !== null}
              participant={participant}
              selectedCohort={selectedCohort}
              onSubmit={handleCallAssignCohort}
              onClose={onAssignCohortClose}
            />
            {/* Participant Info */}
            <Box pb={1}>
              <Link to={getNavigateBackLink()} component={RouterLink}>
                {linkName}
              </Link>{' '}
              / {participant.fullName}
            </Box>
            <Typography variant='h2'>Participant Details</Typography>
            <Grid container spacing={2} className={classes.gridSection}>
              {Object.keys(keyLabelMap).map((key) => (
                <Grid key={key} item xs={12} sm={6} xl={3}>
                  <Typography variant='body1'>
                    <b>{keyLabelMap[key]}</b>
                  </Typography>
                  <Typography test-id={'participantDetailsView' + key} variant='body1'>
                    {participant[key]}
                  </Typography>
                </Grid>
              ))}
            </Grid>

            {/* Participant RoS Info */}
            {participant.ros && (
              <CheckPermissions
                permittedRoles={['health_authority', 'employer', 'ministry_of_health']}
              >
                <Typography variant='h2'>Return of Service</Typography>
                <Grid container spacing={2} className={classes.gridSection}>
                  {Object.keys(rosKeyMap).map((key) => {
                    const participantRos = participant.ros[key];
                    const rosKey = rosKeyMap[key];

                    const gridItem = (
                      <Grid key={key} item xs={12} sm={6} xl={3}>
                        <Box display='flex'>
                          <Box>
                            <Typography variant='body1'>
                              <b>{rosKey?.label}</b>
                            </Typography>
                            <Typography test-id={'participantDetailsRosView' + key} variant='body1'>
                              {participantRos}
                            </Typography>
                          </Box>
                          {isMoH && rosKey?.editable && (
                            <Box pl={4}>
                              <Button
                                text='Edit'
                                variant='outlined'
                                color='primary'
                                startIcon={<EditIcon />}
                                fullWidth={false}
                                size='small'
                                onClick={() => handleSetEditRosField(key)}
                              />
                            </Box>
                          )}
                        </Box>
                      </Grid>
                    );
                    return participantRos ? gridItem : null;
                  })}
                </Grid>
              </CheckPermissions>
            )}
            <CheckPermissions permittedRoles={['ministry_of_health', 'superuser']}>
              <Button
                test-id='editInfoButton'
                text='Edit Info'
                variant='outlined'
                color='primary'
                onClick={showEditInfoModal}
                fullWidth={false}
              />
            </CheckPermissions>

            {!disableAssign && !participant.ros && (
              <>
                <CheckPermissions permittedRoles={['employer', 'health_authority']}>
                  <PSICohortView
                    psiList={psiList}
                    assignAction={(cohort) => setSelectedCohort(cohort)}
                    participant={actualParticipant}
                    fetchData={() =>
                      fetchData({
                        setParticipant,
                        setPSIList,
                        setActualParticipant,
                        setDisableAssign,
                        setError,
                        id,
                      })
                    }
                  />
                </CheckPermissions>
              </>
            )}
          </Card>
        )}
      </CheckPermissions>

      {/** Modals */}
      <EditParticipantDialog
        participant={actualParticipant}
        isOpen={showEditModal}
        onSubmit={onUpdateInfo}
        onClose={handleEditParticipantClose}
      />

      <EditRosStartDateDialog
        isOpen={editFormField === 'startDate'}
        onClose={handleEditRosFieldClose}
        onSubmit={handleEditRosField}
      />

      <EditRosDateDialog
        isOpen={editFormField === 'date'}
        onClose={handleEditRosFieldClose}
        onSubmit={handleEditRosField}
      />

      <EditRosSiteDialog
        isOpen={editFormField === 'siteName'}
        onClose={handleEditRosFieldClose}
        onSubmit={handleEditRosField}
      />
    </Page>
  );
};
