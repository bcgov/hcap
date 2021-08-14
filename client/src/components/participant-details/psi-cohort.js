import React, { useState } from 'react';
import Grid from '@material-ui/core/Grid';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { Box } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import {
  Route,
  useRouteMatch,
  Switch,
  useHistory,
  useParams,
  BrowserRouter as Router,
  Redirect,
} from 'react-router-dom';

// Component
import { PSICohortTable } from './psi-cohort-table';

const TabDetails = {
  assignCohort: {
    label: 'Assign Cohort',
    path: '/',
  },
  withdrawCohort: {
    label: 'Withdraw Cohort',
    path: '/withdraw-cohort',
  },
};

const CustomTabs = withStyles((theme) => ({
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
    minWidth: 72,
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

const PSIRouteTabs = ({ selectedTab = 'assignCohort' }) => {
  const history = useHistory();
  const [isLoadingData] = useState(false);
  const [tab, setTab] = useState(selectedTab);
  return (
    <>
      <CustomTabs
        value={tab}
        onChange={(_, prop) => {
          setTab(prop);
          history.push(TabDetails[prop]?.path);
        }}
      >
        {Object.keys(TabDetails).map((key) => (
          <CustomTab
            key={key}
            label={TabDetails[key].label}
            value={key}
            disabled={isLoadingData}
          ></CustomTab>
        ))}
      </CustomTabs>
      <Switch>
        <Route
          exact
          path={TabDetails.withdrawCohort.path}
          render={() => <h1>Work in progress</h1>}
        ></Route>
        <Route exact path={TabDetails.assignCohort.path}>
          <PSICohortTable />
        </Route>
        <Redirect to='/' />
      </Switch>
    </>
  );
};

export const PSICohortView = () => {
  const match = useRouteMatch();
  const { tab } = useParams();
  const tabKey = Object.keys(TabDetails).reduce((incoming, key) =>
    TabDetails[key]?.path === `/${tab}` ? key : incoming
  );
  const baseUrl = match.url.split(tab)[0];
  return (
    <Grid
      container
      alignContent='flex-start'
      justify='flex-start'
      alignItems='center'
      direction='row'
    >
      <Box pt={2} pb={2} pl={2} pr={2} width='100%' height='auto'>
        <Router basename={baseUrl}>
          <PSIRouteTabs selectedTab={tabKey}></PSIRouteTabs>
        </Router>
      </Box>
    </Grid>
  );
};
