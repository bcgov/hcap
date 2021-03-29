import React, { useEffect, useState } from 'react';
import Grid from '@material-ui/core/Grid';
import { Page, CheckPermissions } from '../../components/generic';
import { Form } from '../../components/employer-form';
import { scrollUp } from '../../utils';
import store from 'store';
import { API_URL } from '../../constants';

export default ({ match }) => {
  const [roles, setRoles] = useState([]);
  const [user, setUser] = useState(undefined);
  const [isLoadingUser, setLoadingUser] = useState(true);
  const expressionID = match.params.id;

  const fetchUserInfo = async () => {
    const response = await fetch(`${API_URL}/api/v1/user`, {
      headers: {
        'Authorization': `Bearer ${store.get('TOKEN')}`,
      },
      method: 'GET',
    });

    if (response.ok) {
      const { roles } = await response.json();
      setRoles(roles);
    }
  }

  useEffect(() => {
    const fetchDetails = async () => {
      const response = await fetch(`${API_URL}/api/v1/employer-form/${expressionID}`, {
        headers: {
          'Authorization': `Bearer ${store.get('TOKEN')}`,
        },
        method: 'GET',
      });

      if (response.ok) {
        setUser(await response.json());
        setLoadingUser(false);
      }
    }

    setLoadingUser(true);
    fetchUserInfo();
    fetchDetails();
  }, [expressionID]);

  scrollUp();
  return (
    <Page>
      <CheckPermissions isLoading={isLoadingUser} roles={roles} permittedRoles={['health_authority', 'ministry_of_health']} renderErrorMessage={true}>
        <Grid item xs={12} sm={11} md={10} lg={8} xl={6}>
          <Form
            initialValues={user}
            hideCollectionNotice
            isDisabled
          />
        </Grid>
      </CheckPermissions>
    </Page>
  );
};
