import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Grid from '@mui/material/Grid';
import { Page, CheckPermissions } from '../../components/generic';
import { Form } from '../../components/employer-form';
import { scrollUp } from '../../utils';
import storage from '../../utils/storage';
import { API_URL, Role } from '../../constants';

export default () => {
  const [user, setUser] = useState(undefined);
  const { id: expressionID } = useParams();

  useEffect(() => {
    const fetchDetails = async () => {
      const response = await fetch(`${API_URL}/api/v1/employer-form/${expressionID}`, {
        headers: {
          Authorization: `Bearer ${storage.get('TOKEN')}`,
        },
        method: 'GET',
      });

      if (response.ok) {
        setUser(await response.json());
      }
    };
    fetchDetails();
  }, [expressionID]);

  scrollUp();
  return (
    <Page>
      <CheckPermissions
        permittedRoles={[Role.HealthAuthority, Role.MinistryOfHealth]}
        renderErrorMessage={true}
      >
        <Grid item xs={12} sm={11} md={10} lg={8} xl={6}>
          <Form initialValues={user} hideCollectionNotice isDisabled />
        </Grid>
      </CheckPermissions>
    </Page>
  );
};
