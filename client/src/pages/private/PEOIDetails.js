import React from 'react';
import { Button } from '../../components/generic/Button';
import Typography from '@material-ui/core/Typography';
import { Page } from '../../components/generic';
import { API_URL } from '../../constants';
import store from 'store';

import { Box } from '@material-ui/core';

import * as qs from 'querystring';

export default (props) => {
  const query = qs.parse(props.location.search.slice(1), '&', '=');
  return (
    <Page>
      <Box m={2}>
        <Typography variant={'h1'}>PEOI LANDING</Typography>
      </Box>
      <Button
        fullWidth={false}
        text={'Reconfirm Interest'}
        onClick={async () => {
          const res = await fetch(`${API_URL}/api/v1/user/peoi?id=${query.id}`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${store.get('TOKEN')}`,
              Accept: 'application/json',
              'Content-type': 'application/json',
            },
          });
          console.log(res);
        }}
      />
      <Button fullWidth={false} text={'Withdraw Expression of Interest'} />
    </Page>
  );
};
