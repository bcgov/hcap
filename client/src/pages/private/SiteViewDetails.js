import React, { useEffect, useState } from 'react';
import Grid from '@material-ui/core/Grid';
import { Page, CheckPermissions } from '../../components/generic';
import { scrollUp } from '../../utils';
import store from 'store';

export default (props) => {
  const [roles, setRoles] = useState([]);
  const [site, setSite] = useState([]);
  const [isLoadingUser, setLoadingUser] = useState(false);
  const siteID = props.match.params.id;

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
    const fetchDetails = async () => {
      const response = await fetch(`/api/v1/employer-sites/${siteID}`, {
        headers: {
          'Authorization': `Bearer ${store.get('TOKEN')}`,
        },
        method: 'GET',
      });

      if (response.ok) {
        setSite(await response.json());
      }
    }

    fetchDetails();
  }, [siteID]);

  scrollUp();
  return (
    <Page>
      <CheckPermissions isLoading={isLoadingUser} roles={roles} permittedRoles={['health_authority', 'ministry_of_health']} renderErrorMessage={true}>
        <Grid item xs={12} sm={11} md={10} lg={8} xl={6}>
          <p>{JSON.stringify(site)}</p>
        </Grid>
      </CheckPermissions>
    </Page>
  );
};
