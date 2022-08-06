// Participant Details Page
// Dependency
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import _orderBy from 'lodash/orderBy';

import { Box, Card, Grid, Link, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import EditIcon from '@material-ui/icons/Edit';

// Libs
import { keyLabelMap, displayData, fetchData } from './constants';
import { AssignCohortDialog, EditParticipantDialog, EditRosFieldDialog } from './modals';
import { useToast } from '../../../hooks';
import { AuthContext } from '../../../providers';
import { Page, CheckPermissions, Alert, Button } from '../../../components/generic';
import {
  ToastStatus,
  Routes,
  EditRosDateSchema,
  EditRosSiteSchema,
  EditRosStartDateSchema,
  mohEditType,
  MAX_LABEL_LENGTH,
} from '../../../constants';
import { updateParticipant, assignParticipantWithCohort, getAllSites } from '../../../services';
import { addEllipsisMask } from '../../../utils';

// Sub component
import { PSICohortView } from '../../../components/participant-details';

const useStyles = makeStyles((theme) => ({
  root: {
    marginBottom: theme.spacing(2),
    padding: theme.spacing(4),
  },
  gridSection: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
}));

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
  const [editFormField, setEditFormField] = useState(null);
  const [allSites, setAllSites] = useState([]);
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
  const linkName = page === 'participant' ? 'Participant' : 'Site View';
  // Edit Button flag
  const enableEdit = roles.some((role) => ['ministry_of_health', 'superuser'].includes(role));
  const isMoH = roles.includes('ministry_of_health');

  const rosKeyMap = {
    siteName: {
      label: 'Current Site',
      editable: true,
      type: mohEditType.AUTOCOMPLETE,
      validation: EditRosSiteSchema,
      options: _orderBy(allSites, ['siteName']).map((item) => ({
        value: item.siteId,
        label: addEllipsisMask(item.siteName, MAX_LABEL_LENGTH),
      })),
    },
    healthAuthority: { label: 'Health Authority (current site)', editable: false },
    date: {
      label: 'RoS Start Date',
      editable: true,
      type: mohEditType.DATE,
      validation: EditRosDateSchema,
    },
    startDate: {
      label: 'RoS Start Date at a Current Site',
      editable: true,
      type: mohEditType.DATE,
      validation: EditRosStartDateSchema,
    },
    endDate: { label: 'RoS End Date', editable: false },
  };

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
    } catch (error) {
      openToast({
        status: ToastStatus.Error,
        message: `${error}`,
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
  const handleNavigateBackLink = () => {
    switch (linkName) {
      case 'Participant':
        history.push(Routes.ParticipantView);
        break;
      case 'Site View':
        history.push(Routes.SiteView + `/${pageId}`);
        break;
      default:
        history.goBack();
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

  // Update selected RoS field
  const handleEditRosSubmit = (values) => {
    console.log(values);

    try {
      openToast({
        status: ToastStatus.Success,
        message: `${rosKeyMap[editFormField]?.label} is successfully updated`,
      });
    } catch (err) {
      setError(`${err}`);
    }

    handleEditRosFieldClose();
  };

  const fetchAllSites = async () => {
    try {
      const { data = [] } = await getAllSites();
      setAllSites(data);
    } catch (err) {
      openToast({
        status: ToastStatus.Error,
        message: err.message,
      });
    }
  };

  // Rendering Hook
  useEffect(() => {
    fetchData({ setParticipant, setPSIList, setActualParticipant, setDisableAssign, setError, id });
  }, [setParticipant, setPSIList, setActualParticipant, setError, setDisableAssign, openToast, id]);

  useEffect(() => {
    if (allSites.length === 0) {
      fetchAllSites();
    }
  });

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
          <Card className={classes.root}>
            {selectedCohort !== null && (
              <AssignCohortDialog
                isOpen={selectedCohort !== null}
                participant={participant}
                selectedCohort={selectedCohort}
                onSubmit={handleCallAssignCohort}
                onClose={onAssignCohortClose}
              />
            )}

            {/* Participant Info */}
            <Box pb={1}>
              <Typography variant='body1'>
                <Link onClick={handleNavigateBackLink}>{linkName}</Link> /{participant.fullName}
              </Typography>
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
            <CheckPermissions
              permittedRoles={['health_authority', 'employer', 'ministry_of_health']}
            >
              {participant.ros && (
                <>
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
                              <Typography
                                test-id={'participantDetailsRosView' + key}
                                variant='body1'
                              >
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
                </>
              )}
            </CheckPermissions>

            <Button
              test-id='editInfoButton'
              text='Edit Info'
              variant='outlined'
              color='primary'
              disabled={!enableEdit}
              onClick={showEditInfoModal}
              fullWidth={false}
            />

            {!participant.ros && (
              <CheckPermissions permittedRoles={['health_authority']}>
                {!disableAssign && (
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
                )}
              </CheckPermissions>
            )}
          </Card>
        )}
      </CheckPermissions>

      {/** Modals */}
      {showEditModal && actualParticipant && (
        <EditParticipantDialog
          participant={actualParticipant}
          isOpen={showEditModal}
          onSubmit={onUpdateInfo}
          onClose={handleEditParticipantClose}
        />
      )}

      <EditRosFieldDialog
        title={`Edit ${rosKeyMap[editFormField]?.label}`}
        isOpen={Boolean(editFormField)}
        onClose={handleEditRosFieldClose}
        onSubmit={handleEditRosSubmit}
        validation={rosKeyMap[editFormField]?.validation}
        rosFieldType={rosKeyMap[editFormField]?.type}
        fieldName={editFormField}
        fieldLabel={rosKeyMap[editFormField]?.label}
        fieldOptions={rosKeyMap[editFormField]?.options}
      />
    </Page>
  );
};
