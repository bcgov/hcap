import React, { useEffect, useState } from 'react';
import Grid from '@material-ui/core/Grid';
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

import { TrackGraduation } from './track-graduation';

// Service
import { sortPSI } from '../../services';

// Component
import { PSICohortTable } from './psi-cohort-table';
import { CustomTab, CustomTabs } from '../generic';

const TabDetails = {
  assignCohort: {
    label: 'Assign Cohort',
    path: '/',
  },
  trackGraduation: {
    label: 'Track Graduation',
    path: '/track-graduation',
  },
};

const tabKeyForPath = (path) => {
  const tabKey = Object.keys(TabDetails).find((key) => TabDetails[key].path === path);
  return { tabKey, tabInfo: TabDetails[tabKey] };
};

// Smaller standalone components
const TabContentAssignCohort = ({ disabled, psiList, assignAction, fetchData }) => {
  return disabled ? (
    <div>
      <Box>
        <Typography variant='h3'> Assigning Cohort</Typography>
        <br />
        <Typography variant='body1'>
          This participant has already been assigned a cohort.
        </Typography>
      </Box>
    </div>
  ) : (
    <PSICohortTable
      disabled={disabled}
      rows={psiList}
      assignAction={assignAction}
      fetchData={fetchData}
    />
  );
};

const TabContentTrackGraduation = ({ participant, fetchData }) => {
  return <TrackGraduation participant={participant} fetchData={fetchData} />;
};

const PSIRouteTabs = ({
  selectedTab = 'assignCohort',
  psiList = [],
  assignAction,
  participant = {},
  fetchData,
}) => {
  const history = useHistory();
  const [isLoadingData] = useState(false);
  const [tab, setTab] = useState(selectedTab);
  const disabled =
    participant !== null &&
    participant.cohort !== undefined &&
    Object.keys(participant.cohort).length > 0;

  useEffect(() => {
    let unsubscribe = history.listen((location) => {
      const { pathname: path } = location;
      const { tabKey } = tabKeyForPath(path);
      if (tabKey !== tab) {
        setTab(tabKey);
      }
    });

    return () => unsubscribe();
  }, [tab, setTab, history]);

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
        <Route exact path={TabDetails.trackGraduation.path}>
          <TabContentTrackGraduation
            tab={tab}
            setTab={setTab}
            participant={participant}
            fetchData={fetchData}
          />
        </Route>

        <Route exact path={TabDetails.assignCohort.path}>
          <TabContentAssignCohort
            tab={tab}
            setTab={setTab}
            fetchData={fetchData}
            assignAction={assignAction}
            disabled={disabled}
            psiList={psiList}
          />
        </Route>
        <Redirect to='/' />
      </Switch>
    </>
  );
};

export const PSICohortView = ({ psiList = [], assignAction, participant, fetchData }) => {
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
            fetchData={fetchData}
          ></PSIRouteTabs>
        </Router>
      </Box>
    </Grid>
  );
};
