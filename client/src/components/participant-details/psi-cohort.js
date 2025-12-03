import React, { useEffect, useMemo, useState } from 'react';
import { Typography, Box } from '@mui/material';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { AuthContext } from '../../providers';

import { postHireStatuses, Role } from '../../constants';

// Service
import { sortPSI } from '../../services';

// Component
import { PSICohortTable } from './psi-cohort-table';
import { TrackGraduation } from './track-graduation';
import { CustomTab, CustomTabs } from '../generic';

const tabKeyForPath = (tabDetails, path) => {
  const tabKey = Object.keys(tabDetails).find((key) => path.endsWith(tabDetails[key].path));
  return { tabKey, tabInfo: tabDetails[tabKey] };
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

  // Allow assignment if participant has no cohort
  if (!participant.cohort) return true;

  // Allow assignment if cohort is empty object
  if (Object.keys(participant.cohort).length === 0) return true;

  // Allow assignment if previous cohort was unsuccessful
  const hasUnsuccessfulCohort =
    participant.postHireStatus?.status === postHireStatuses.cohortUnsuccessful;
  return hasUnsuccessfulCohort;
};

const PSIRouteTabs = ({
  selectedTab,
  psiList = [],
  assignAction,
  participant = {},
  tabDetails,
  fetchData,
}) => {
  const navigate = useNavigate();
  const params = useParams();
  const [isLoadingData] = useState(false);
  const [tab, setTab] = useState(selectedTab);
  const disabled = !canAssignCohort(participant);

  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    const { tabKey } = tabKeyForPath(tabDetails, path);
    const defaultTabKey = Object.keys(tabDetails)[0];

    if (tabKey && tabKey !== tab) {
      setTab(tabKey);
    } else if (!tabKey) {
      // If no tab is detected from URL, navigate to the default tab
      const basePath = `/participant-details/${params.page}/${params.pageId}/${params.id}`;
      const defaultPath = `${basePath}/${tabDetails[defaultTabKey]?.path}`;
      navigate(defaultPath, { replace: true });
    }
  }, [tab, tabDetails, location, params, navigate]);

  return (
    <>
      <CustomTabs
        value={tab}
        onChange={(_, prop) => {
          setTab(prop);
          // Construct the correct path by replacing any existing tab segment
          const basePath = `/participant-details/${params.page}/${params.pageId}/${params.id}`;
          const newPath = `${basePath}/${tabDetails[prop]?.path}`;
          navigate(newPath);
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
      {/* Render content based on active tab instead of nested routes */}
      {tab === 'trackGraduation' && tabDetails.trackGraduation && (
        <TabContentTrackGraduation
          tab={tab}
          setTab={setTab}
          participant={participant}
          fetchData={fetchData}
        />
      )}

      {tab === 'assignCohort' && tabDetails.assignCohort && (
        <TabContentAssignCohort
          tab={tab}
          setTab={setTab}
          fetchData={fetchData}
          assignAction={assignAction}
          disabled={disabled}
          psiList={psiList}
        />
      )}
    </>
  );
};

export const PSICohortView = ({ psiList = [], assignAction, participant, fetchData }) => {
  const { auth } = AuthContext.useAuth();
  const roles = useMemo(() => auth.user?.roles || [], [auth.user?.roles]);
  const sortedList = sortPSI({ psiList, cohort: participant ? participant.cohort : {} });

  // Determine the tags depending on user role
  const assignCohort = {
    label: 'Assign Cohort',
    path: 'assign-cohort',
  };
  const trackGraduation = {
    label: 'Track Graduation',
    path: 'track-graduation',
  };
  let tabDetails = { trackGraduation };
  if (roles.includes(Role.HealthAuthority) || roles.includes(Role.MinistryOfHealth)) {
    tabDetails = { assignCohort, trackGraduation };
  }
  const tabKey = Object.keys(tabDetails)[0];

  return (
    <Box p={4}>
      <PSIRouteTabs
        selectedTab={tabKey}
        psiList={sortedList}
        assignAction={assignAction}
        participant={participant}
        fetchData={fetchData}
        tabDetails={tabDetails}
      ></PSIRouteTabs>
    </Box>
  );
};
