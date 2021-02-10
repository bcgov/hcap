import React, { useEffect, useState, lazy } from 'react';
import { Page, CheckPermissions } from '../../components/generic';
import { Box, Typography } from '@material-ui/core';
import store from 'store';

const SiteTable = lazy(() => import('./SiteTable'));

export default () => {

  const [roles, setRoles] = useState([]);
  const [isLoadingUser, setLoadingUser] = useState(false);

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
      setRoles(roles);
      setLoadingUser(false);
    }
  }

  useEffect(() => {
    fetchUserInfo();
  }, []);

  return (
    <Page>
      <Box pt={4} pb={4} pl={2} pr={2}>
        <Typography variant="subtitle1" gutterBottom>
          Sites
        </Typography>
      </Box>
      <CheckPermissions 
        isLoading={isLoadingUser} 
        roles={roles} 
        permittedRoles={['health_authority', 'ministry_of_health']} 
        renderErrorMessage={true}
      >
        <SiteTable sites={[]}/>
      </CheckPermissions>
    </Page>
  );
};
