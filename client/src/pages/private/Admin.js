import React, { useState } from 'react';
import Grid from '@material-ui/core/Grid';
import { Page, Button } from '../../components/generic';
import store from 'store';

export default () => {

  const handleSubmit = async () => {

    const response = await fetch('/api/v1/admin', {
      headers: {
        'Accept': 'application/json',
        'Content-type': 'application/json',
        'Authorization': `Bearer ${store.get('TOKEN')}`,
      },
      method: 'GET',
    });

    if (response.ok) {
      console.log('aaaaaa');
      console.log(response);
      return;
    }
  };

  return (
    <Page >
      <Grid container alignItems="center" justify="center" >
        <Button
          onClick={() => handleSubmit()}
          variant="contained"
          color="primary"
          fullWidth={false}
          text="Submit"
        />
      </Grid>
    </Page>
  );
};
