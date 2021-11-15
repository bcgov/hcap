import React from 'react';
import store from 'store';
import { Page } from '../../components/generic';
import { Grid } from '@material-ui/core';
import { Form } from '../../components/participant-form';
import { DisabledLanding } from '../../components/participant-form/DisabledLanding';

export default () => {
  const appEnv = store.get('APP_ENV') || 'prod';
  return (
    <Page hideEmployers={!window.location.hostname.includes('freshworks.club')}>
      {appEnv === 'prod' ? (
        <DisabledLanding />
      ) : (
        <Grid item xs={12} sm={11} md={10} lg={8} xl={6}>
          <Form />
        </Grid>
      )}
    </Page>
  );
};
