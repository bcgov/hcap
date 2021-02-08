import React, { lazy, useState, useEffect } from 'react';
import Grid from '@material-ui/core/Grid';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { withStyles } from '@material-ui/core/styles';
import { Page, CheckPermissions } from '../../components/generic';
import store from 'store';

const ParticipantTable = lazy(() => import('./ParticipantTable'));
const SiteTable = lazy(() => import('./SiteTable'));

const CustomTabs = withStyles(theme => ({
  root: {
    borderBottom: `1px solid ${theme.palette.gray.secondary}`,
    marginBottom: theme.spacing(2),
  },
  indicator: {
    backgroundColor: theme.palette.highlight.primary,
  },
}))(Tabs);

const CustomTab = withStyles((theme) => ({
  root: {
    textTransform: 'none',
    minWidth: 60,
    fontWeight: theme.typography.fontWeightRegular,
    marginRight: theme.spacing(4),
    '&:hover': {
      color: theme.palette.highlight.primary,
      opacity: 1,
    },
    '&$selected': {
      color: theme.palette.highlight.secondary,
      fontWeight: theme.typography.fontWeightMedium,
    },
    '&:focus': {
      color: theme.palette.highlight.primary,
    },
  },
  selected: {},
}))((props) => <Tab disableRipple {...props} />);


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
            <CustomTabs value={ tabValue } onChange={handleTabChange} aria-label="tabs">
              <CustomTab label="Participants" id='participantsTab' key='participants' />
              <CustomTab label="My Sites" id='sitesTab' key='sites' />
            </CustomTabs>
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
