import React, { lazy, useState } from 'react';
import { styled } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { Page, CheckPermissions } from '../../components/generic';
import { AuthContext, ParticipantsContext } from '../../providers';

const PREFIX = 'ParticipantView';

const classes = {
  root: `${PREFIX}-root`,
  indicator: `${PREFIX}-indicator`,
  root2: `${PREFIX}-root2`,
  selected: `${PREFIX}-selected`,
};

const StyledPage = styled(Page)(({ theme }) => ({
  [`& .${classes.root}`]: {
    borderBottom: `1px solid ${theme.palette.gray.secondary}`,
    marginBottom: theme.spacing(2),
  },

  [`& .${classes.indicator}`]: {
    backgroundColor: theme.palette.highlight.primary,
  },

  [`& .${classes.root2}`]: {
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

  [`& .${classes.selected}`]: {},
}));

const ParticipantTable = lazy(() => import('./ParticipantTable'));
const SiteTable = lazy(() => import('./SiteTable'));

const CustomTabs = Tabs;

const CustomTab = styled(Tab)(({ theme }) => ({
  [`& .${classes.root2}`]: {
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

  [`& .${classes.selected}`]: {},
}));

export default () => {
  const [tabValue, setTabValue] = useState(0);
  const { auth } = AuthContext.useAuth();
  const sites = auth.user?.sites || [];
  const roles = auth.user?.roles || [];

  const handleTabChange = (event, newTabValue) => {
    setTabValue(newTabValue);
  };

  return (
    <StyledPage>
      <CheckPermissions
        permittedRoles={['employer', 'health_authority', 'ministry_of_health']}
        renderErrorMessage={true}
      >
        <Grid container justifyContent='flex-start' alignItems='flex-start' direction='row'>
          <CustomTabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label='tabs'
            classes={{
              root: classes.root,
              indicator: classes.indicator,
            }}
          >
            <CustomTab
              label='Participants'
              id='participantsTab'
              key='participants'
              classes={{
                root: classes.root2,
                selected: classes.selected,
              }}
            />
            {roles.includes('superuser') && (
              <CustomTab
                label='My Sites'
                id='sitesTab'
                key='sites'
                classes={{
                  root: classes.root2,
                  selected: classes.selected,
                }}
              />
            )}
          </CustomTabs>
        </Grid>
        <Grid container alignItems='center' justifyContent='flex-start' direction='column'>
          {tabValue === 0 && (
            <ParticipantsContext.ParticipantsProvider role={auth.permissionRole}>
              <ParticipantTable />
            </ParticipantsContext.ParticipantsProvider>
          )}

          {tabValue === 1 && <SiteTable sites={sites} />}
        </Grid>
      </CheckPermissions>
    </StyledPage>
  );
};
