// Participant Details Page
// Dependency
import pick from 'lodash/pick';
import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Card, Grid, Link, Typography, Button } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

// Libs
import { AuthContext } from '../../providers';
import { Page, CheckPermissions, Alert, Dialog } from '../../components/generic';
import { Routes, EditParticipantFormSchema } from '../../constants';
import { EditParticipantForm } from '../../components/modal-forms';
import { updateParticipant, fetchParticipant } from '../../services';

// Key Map
const keyLabelMap = {
  fullName: 'Full Name',
  phoneNumber: 'Phone Number',
  emailAddress: 'Email Address',
  interested: 'Program Interest',
  preferredLocation: 'Preferred Location',
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

export default () => {
  // State
  const [error, setError] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [actualParticipant, setActualParticipant] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [message, setMessage] = useState('Loading participant details');
  // Auth context
  const { auth } = AuthContext.useAuth();
  // Memo roles
  const roles = useMemo(() => auth.user?.roles || [], [auth.user?.roles]);
  // Style classes
  const classes = customStyle();
  // Get param
  const { id } = useParams();
  // Edit Button flag
  const enableEdit = roles.some((role) => ['ministry_of_health', 'superuser'].includes(role));

  // UI Actions
  // 1. Show edit
  const showEditInfoModal = async () => setShowEditModal(true);
  // 2. Update Info
  const onUpdateInfo = async (values) => {
    setShowEditModal(false);
    try {
      const [updatedParticipant] = await updateParticipant(values, actualParticipant);
      setMessage('Update Success');
      setParticipant(displayData(updatedParticipant));
      setActualParticipant(updatedParticipant);
      setTimeout(() => {
        setMessage('');
      }, 1000);
    } catch (err) {
      setError(`${err}`);
    }
  };
  // Rendering Hook
  useEffect(() => {
    fetchParticipant({ id })
      .then((resp) => {
        setParticipant(displayData(resp));
        setActualParticipant(resp);
      })
      .catch((err) => {
        setError(`${err}`);
      });
  }, [setParticipant, setActualParticipant, setError, id]);

  // Render
  return (
    <Page>
      <CheckPermissions
        permittedRoles={['employer', 'health_authority', 'ministry_of_health']}
        renderErrorMessage={true}
      >
        {error && <Alert severity='error'>{error}</Alert>}
        {!participant && !error && <Alert severity='info'>{message}</Alert>}
        {message === 'Update Success' && <Alert severity='success'>{message}</Alert>}
        {participant && (
          <Card>
            <Box pt={4} pb={2} pl={4} pr={4}>
              <Box pb={4} pl={2}>
                <Box pb={2}>
                  <Typography variant='body1'>
                    <Link href={Routes.ParticipantView}>Participants</Link> /{participant.fullName}
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
              initialValues={{ ...actualParticipant }}
              validationSchema={EditParticipantFormSchema}
              onSubmit={onUpdateInfo}
              onClose={() => setShowEditModal(false)}
            />
          </Dialog>
        )}
      </>
    </Page>
  );
};