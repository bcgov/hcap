import React, { useEffect, useState } from 'react';
import Grid from '@material-ui/core/Grid';
import { useLocation } from 'react-router-dom';
import { Page, CheckPermissions } from '../../components/generic';
import { Form } from '../../components/employer-form';
import { scrollUp } from '../../utils';
import store from 'store';

export default (props) => {
  const [roles, setRoles] = useState([]);
  const [user, setUser] = useState(undefined);
  const [isLoadingUser, setLoadingUser] = useState(false);
  const location = useLocation();
  const ExpressionID = props.match.params.id;

  const fetchUserInfo = async () => {
    setLoadingUser(true);
    const response = await fetch('/api/v1/user', {
      headers: {
        'Authorization': `Bearer ${store.get('TOKEN')}`,
      },
      method: 'GET',
    });

    if (response.ok) {
      const { roles } = await response.json();
      setLoadingUser(false);
      setRoles(roles);
    }
  }

  useEffect(() => {
    fetchUserInfo();
  }, []);

  useEffect(() => {
    // This is only being used for logging at the moment
    setLoadingUser(true);
    const fetchDetails = async () => {
      const response = await fetch(`/api/v1/employer-form/${ExpressionID}`, {
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

    fetchDetails();
  }, [ExpressionID]);

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
