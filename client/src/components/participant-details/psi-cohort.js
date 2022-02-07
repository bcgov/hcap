import React, { useState } from 'react';
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
  withdrawCohort: {
    label: 'Withdraw Cohort',
    path: '/withdraw-cohort',
  },
  trackGraduation: {
    label: 'Track Graduation',
    path: '/track-graduation',
  },
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
        <Route
          exact
          path={TabDetails.trackGraduation.path}
          render={() => <TrackGraduation participant={participant} fetchData={fetchData} />}
        ></Route>

        <Route exact path={TabDetails.assignCohort.path}>
          {disabled && (
            <div>
              <Box>
                <Typography variant='h3'> Assigning Cohort</Typography>
                <br />
                <Typography variant='body1'>
                  This participant has already been assigned a cohort. To reassign the cohort,
                  please click on 'Withdraw Cohort' to withdraw them first.
                </Typography>
              </Box>
            </div>
          )}
          {!disabled && (
            <PSICohortTable
              disabled={disabled}
              rows={psiList}
              assignAction={assignAction}
              fetchData={fetchData}
            />
          )}
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
