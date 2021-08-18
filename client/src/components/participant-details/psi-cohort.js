import React, { useState } from 'react';
import Grid from '@material-ui/core/Grid';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { withStyles } from '@material-ui/core/styles';
import { Typography, Box } from '@material-ui/core';
import {
  Route,
  useRouteMatch,
  Switch,
  useHistory,
  useParams,
  BrowserRouter as Router,
  Redirect,
} from 'react-router-dom';

// Service
import { sortPSI } from '../../services';

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

const PSIRouteTabs = ({
  selectedTab = 'assignCohort',
  psiList = [],
  assignAction,
  participant = {},
}) => {
  const history = useHistory();
  const [isLoadingData] = useState(false);
  const [tab, setTab] = useState(selectedTab);
  const disabled =
    participant !== null &&
    participant.cohort !== undefined &&
    Object.keys(participant.cohort).length > 0;
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
          {disabled && (
            <div>
              <Box>
                <Typography variant='h3'> Assigning Cohort</Typography>
                <br />
                <Typography variant='body1'>
                  {' '}
                  This participant has been assigned cohort. To re-assign cohort. Please click on
                  withdraw cohort to withdraw participant from cohort. After that, you can assign
                  cohort in "Assigning Cohort"
                </Typography>
              </Box>
            </div>
          )}
          {!disabled && (
            <PSICohortTable disabled={disabled} rows={psiList} assignAction={assignAction} />
          )}
        </Route>
        <Redirect to='/' />
      </Switch>
    </>
  );
};

export const PSICohortView = ({ psiList = [], assignAction, participant }) => {
  const match = useRouteMatch();
  const { tab } = useParams();
  const tabKey = Object.keys(TabDetails).reduce((incoming, key) =>
    TabDetails[key]?.path === `/${tab}` ? key : incoming
  );
  const baseUrl = match.url.split(tab)[0];
  const sortedList = sortPSI({ psiList, cohort: participant ? participant.cohort : {} });
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
          <PSIRouteTabs
            selectedTab={tabKey}
            psiList={sortedList}
            assignAction={assignAction}
            participant={participant}
          ></PSIRouteTabs>
        </Router>
      </Box>
    </Grid>
  );
};
