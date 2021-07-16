import React, { useState, useEffect } from 'react';
import { Button } from '../../components/generic/Button';
import Typography from '@material-ui/core/Typography';
import { Page } from '../../components/generic';
import { API_URL } from '../../constants';
import store from 'store';
import { ToastStatus } from '../../constants';

import { Box } from '@material-ui/core';

import * as qs from 'querystring';
import { useToast } from '../../hooks';

export default (props) => {
  const [peoiData, setPeoiData] = useState();
  const query = qs.parse(props.location.search.slice(1), '&', '=');
  const { id, participant_id } = query;
  const { openToast } = useToast();

  useEffect(() => {
    const getDetails = async () => {
      const res = await fetch(
        `${API_URL}/api/v1/user/peoi?id=${id}&participant_id=${participant_id}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${store.get('TOKEN')}`,
            Accept: 'application/json',
            'Content-type': 'application/json',
          },
        }
      );

      setPeoiData(await res.json());
    };
    getDetails();
  }, [setPeoiData, id, participant_id]);

  return (
    <Page>
      <Box m={2}>
        <Typography variant={'h1'}>PEOI detail page for {peoiData.id}</Typography>
      </Box>
      <Box m={2}>
        <Button
          fullWidth={false}
          text={'Reconfirm Interest'}
          onClick={async () => {
            const res = await fetch(`${API_URL}/api/v1/user/peoi/confirm_interest`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${store.get('TOKEN')}`,
                Accept: 'application/json',
                'Content-type': 'application/json',
              },
              body: JSON.stringify({
                id: participant_id,
              }),
            });
            if (res.ok) {
              openToast({
                status: ToastStatus.Success,
                message: 'Interest Confirmed!',
              });
            } else {
              openToast({
                status: ToastStatus.Error,
                message: 'Could not confirm staus',
              });
            }
          }}
        />
      </Box>
      <Button fullWidth={false} text={'Withdraw Expression of Interest'} />
    </Page>
  );
};
