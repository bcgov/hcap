import React, { useEffect, useState, lazy } from 'react';
import Grid from '@material-ui/core/Grid';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { Page, CheckPermissions } from '../../components/generic';
import store from 'store';

const ParticipantTable = lazy(() => import('./ParticipantTable'));
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
      setLoadingUser(false);
      setRoles(roles);
    }
  }

  useEffect(() => {
    fetchUserInfo();
  }, []);

  return (
    <Page>
      <CheckPermissions 
        isLoading={isLoadingUser} 
        roles={roles} 
        permittedRoles={['maximus', 'health_authority', 'ministry_of_health']} 
        renderErrorMessage={true}
      >
        <SiteTable />
      </CheckPermissions>
    </Page>
  );
};
