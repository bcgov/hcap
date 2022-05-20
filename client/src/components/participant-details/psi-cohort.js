import React, { useEffect, useState } from 'react';
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
import { postHireStatuses } from '../../constants';

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
    <Box>
      <Box mb={2}>
        <Typography variant='subtitle1'>Assigning Cohort</Typography>
      </Box>
      <Typography variant='body1'>This participant has already been assigned a cohort.</Typography>
    </Box>
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

const canAssignCohort = (participant) => {
  if (!participant) return false;
  if (participant.cohort !== undefined) {
    return !(participant.postHireStatus?.status === postHireStatuses.cohortUnsuccessful);
  }

  return Object.keys(participant.cohort).length > 0;
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
  const disabled = canAssignCohort(participant);

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
    <Box p={4}>
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
  );
};
