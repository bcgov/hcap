import React, { useEffect, useMemo, useState } from 'react';
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
import { AuthContext } from '../../providers';

import { postHireStatuses, Role } from '../../constants';

// Service
import { sortPSI } from '../../services';

// Component
import { PSICohortTable } from './psi-cohort-table';
import { TrackGraduation } from './track-graduation';
import { CustomTab, CustomTabs } from '../generic';

const tabKeyForPath = (tabDetails, path) => {
  const tabKey = Object.keys(tabDetails).find((key) => tabDetails[key].path === path);
  return { tabKey, tabInfo: tabDetails[tabKey] };
};

const defaultPath = (tabDetails) => {
  const tabKey = Object.keys(tabDetails)[0];
  return tabDetails[tabKey].path;
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
  if (!participant || !participant.cohort) return false;

  const hasUnsuccessfulCohort =
    participant.postHireStatus?.status === postHireStatuses.cohortUnsuccessful;
  return hasUnsuccessfulCohort || Object.keys(participant.cohort).length === 0;
};

const PSIRouteTabs = ({
  selectedTab,
  psiList = [],
  assignAction,
  participant = {},
  tabDetails,
  fetchData,
}) => {
  const history = useHistory();
  const [isLoadingData] = useState(false);
  const [tab, setTab] = useState(selectedTab);
  const disabled = !canAssignCohort(participant);

  useEffect(() => {
    const { pathname: path } = history.location;
    const { tabKey } = tabKeyForPath(tabDetails, path);
    if (tabKey !== tab) {
      setTab(tabKey);
    }
  }, [tab, setTab, tabDetails, history]);

  return (
    <>
      <CustomTabs
        value={tab}
        onChange={(_, prop) => {
          setTab(prop);
          history.push(tabDetails[prop]?.path);
        }}
      >
        {Object.keys(tabDetails).map((key) => (
          <CustomTab
            key={key}
            label={tabDetails[key].label}
            value={key}
            disabled={isLoadingData}
          ></CustomTab>
        ))}
      </CustomTabs>
      <Switch>
        {tabDetails.trackGraduation && (
          <Route exact path={tabDetails.trackGraduation.path}>
            <TabContentTrackGraduation
              tab={tab}
              setTab={setTab}
              participant={participant}
              fetchData={fetchData}
            />
          </Route>
        )}

        {tabDetails.assignCohort && (
          <Route exact path={tabDetails.assignCohort.path}>
            <TabContentAssignCohort
              tab={tab}
              setTab={setTab}
              fetchData={fetchData}
              assignAction={assignAction}
              disabled={disabled}
              psiList={psiList}
            />
          </Route>
        )}
        <Redirect to={defaultPath(tabDetails)} />
      </Switch>
    </>
  );
};

export const PSICohortView = ({ psiList = [], assignAction, participant, fetchData }) => {
  const match = useRouteMatch();
  const { tab } = useParams();
  const { auth } = AuthContext.useAuth();
  const roles = useMemo(() => auth.user?.roles || [], [auth.user?.roles]);
  const baseUrl = match.url.split(tab)[0];
  const sortedList = sortPSI({ psiList, cohort: participant ? participant.cohort : {} });

  // Determine the tags depending on user role
  const assignCohort = {
    label: 'Assign Cohort',
    path: '/assign-cohort',
  };
  const trackGraduation = {
    label: 'Track Graduation',
    path: '/track-graduation',
  };
  let tabDetails = { trackGraduation };
  if (roles.includes(Role.HealthAuthority) || roles.includes(Role.MinistryOfHealth)) {
    tabDetails = { assignCohort, trackGraduation };
  }
  const tabKey = Object.keys(tabDetails)[0];

  return (
    <Box p={4}>
      <Router basename={baseUrl}>
        <PSIRouteTabs
          selectedTab={tabKey}
          psiList={sortedList}
          assignAction={assignAction}
          participant={participant}
          fetchData={fetchData}
          tabDetails={tabDetails}
        ></PSIRouteTabs>
      </Router>
    </Box>
  );
};
