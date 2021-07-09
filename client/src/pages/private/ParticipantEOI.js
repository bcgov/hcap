import React, { useEffect, useState } from 'react';
import Grid from '@material-ui/core/Grid';
import { Redirect, useParams } from 'react-router-dom';
import store from 'store';
import { Routes } from '../../constants';

import { Page, Alert } from '../../components/generic';
import { Form } from '../../components/participant-form';
import { API_URL } from '../../constants';

const fetchParticipant = async (id) => {
  try {
    const response = await fetch(`${API_URL}/api/v1/participant?id=${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${store.get('TOKEN')}`,
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
    });
    const participants = await response.json();
    return participants[0] || null;
  } catch {
    return null;
  }
};

export default () => {
  const { id } = useParams();
  const [participant, setParticipant] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchParticipant(id).then((participant) => {
      setLoading(false);
      setParticipant(participant);
    });
  }, [id, setLoading, setParticipant]);

  if (!id) return <Redirect to={Routes.ParticipantLanding} />;
  return (
    <div id='participant-view'>
      <Page hideEmployers={!window.location.hostname.includes('freshworks.club')}>
        {participant && (
          <Grid item xs={12} sm={11} md={10} lg={8} xl={6}>
            {/** Form */}
            <Form initialValues={participant} isDisabled />
          </Grid>
        )}
        {!participant && !loading && <Alert severity='error'>Unable to load participant</Alert>}
        {!participant && loading && <Alert severity='info'>Loading participant</Alert>}
      </Page>
    </div>
  );
};
