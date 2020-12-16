import React, { useEffect, useState } from 'react';
import Grid from '@material-ui/core/Grid';
import { Routes } from '../../constants';
import { useLocation, Redirect } from 'react-router-dom';
import { Page, CheckPermissions } from '../../components/generic';
import { Form } from '../../components/employer-form';
import { scrollUp } from '../../utils';
import store from 'store';

export default () => {
  const [roles, setRoles] = useState([]);
  const [isLoadingUser, setLoadingUser] = useState(false);
  const [isLoadingDetails, setLoadingDetails] = useState(false);
  const location = useLocation();

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

  const fetchDetails = async () => {
    const id = await location.state?.item.id;
    setLoadingDetails(true);
    const response = await fetch(`/api/v1/employer-sites-detail?id=${id}`, {
      headers: {
        'Authorization': `Bearer ${store.get('TOKEN')}`,
      },
      method: 'GET',
    });

    if (response.ok) {
      let the_deets = await response.json()
      console.log(the_deets)
    }
  }

  useEffect(() => {
    fetchUserInfo();
    fetchDetails();
  }, []);

  if (!location.state) return <Redirect to={Routes.EOIView} />
  scrollUp();
  return (
    <Page>
      <CheckPermissions isLoading={isLoadingUser} roles={roles} permittedRoles={['health_authority', 'ministry_of_health']} renderErrorMessage={true}>
        <Grid item xs={12} sm={11} md={10} lg={8} xl={6}>
          <Form
            initialValues={location.state?.item}
            hideCollectionNotice
            isDisabled
          />
        </Grid>
      </CheckPermissions>
    </Page>
  );
};
