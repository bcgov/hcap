// Participant Details Page
// Dependency
import pick from 'lodash/pick';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Card, Grid, Link, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import store from 'store';

// Libs
import { Page, CheckPermissions, Alert } from '../../components/generic';
import { Routes, API_URL } from '../../constants';

// Network call
const api = async ({ id }) => {
  const url = `${API_URL}/api/v1/participant?id=${id}`;
  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
  });
  if (resp.ok) {
    const [participant] = await resp.json();
    return participant;
  } else {
    throw new Error('Unable to load participant');
  }
};

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
      ? 'Not interested'
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
  // Style classes
  const classes = customStyle();
  // Get param
  const { id } = useParams();

  // Rendering Hook
  useEffect(() => {
    api({ id })
      .then((resp) => {
        setParticipant(displayData(resp));
      })
      .catch((err) => {
        setError(`${err}`);
      });
  }, [setParticipant, setError, id]);

  // Render
  return (
    <Page>
      <CheckPermissions
        permittedRoles={['employer', 'health_authority', 'ministry_of_health']}
        renderErrorMessage={true}
      >
        {error && <Alert severity='error'>{error}</Alert>}
        {!participant && !error && <Alert severity='info'>Loading participant</Alert>}
        {participant && (
          <Card>
            <Box pt={4} pb={2} pl={4} pr={4}>
              <Box pb={4} pl={2}>
                <Box pb={2}>
                  <Typography variant='body1'>
                    <Link href={Routes.ParticipantView}>Participants</Link> / XYZ
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
          </Card>
        )}
      </CheckPermissions>
    </Page>
  );
};
