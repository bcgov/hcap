import React, { lazy, useState, useEffect } from 'react';
import Grid from '@material-ui/core/Grid';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { Page, CheckPermissions } from '../../components/generic';
import store from 'store';

const ParticipantTable = lazy(() => import('./ParticipantTable'));
const SiteTable = lazy(() => import('./SiteTable'));

export default () => {
  const [roles, setRoles] = useState([]);
  const [sites, setSites] = useState([]);
  const [isLoadingUser, setLoadingUser] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const fetchUserInfo = async () => {
    setLoadingUser(true);
    const response = await fetch('/api/v1/user', {
      headers: {
        'Authorization': `Bearer ${store.get('TOKEN')}`,
      },
      method: 'GET',
    });

    if (response.ok) {
      const { roles, sites } = await response.json();
      if (sites) setSites(sites);
      setRoles(roles);
      setLoadingUser(false);
    }
  }

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const handleTabChange = (event, newTabValue) => {
    setTabValue(newTabValue);
  }

  return (
    <Page>
      { roles.includes('employer')
        ? <ParticipantTable /> 
        : <CheckPermissions isLoading={isLoadingUser} roles={roles} permittedRoles={['maximus', 'health_authority', 'ministry_of_health']} renderErrorMessage={true}>
          <Grid container justify="flex-start" alignItems="flex-start" direction="row">
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="tabs">
              <Tab label="Participants" id='participantsTab' />
              <Tab label="My Sites" id='sitesTab' />
            </Tabs>
          </Grid>
          <Grid container alignItems="center" justify="flex-start" direction="column">
          { tabValue === 0 && <ParticipantTable hidden={isLoadingUser}/> }
          { tabValue === 1 && <SiteTable hidden={isLoadingUser} sites={sites}/> }
          </Grid>
        </CheckPermissions>
      }
    </Page>
  );
};
