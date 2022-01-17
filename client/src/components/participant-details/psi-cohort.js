import React, { useState } from 'react';
import { styled } from '@mui/material/styles';
import Grid from '@mui/material/Grid';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { Typography, Box } from '@mui/material';
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

const PREFIX = 'PSICohortView';

const classes = {
  root: `${PREFIX}-root`,
  indicator: `${PREFIX}-indicator`,
  root2: `${PREFIX}-root2`,
  selected: `${PREFIX}-selected`,
};

const StyledGrid = styled(Grid)(({ theme }) => ({
  [`& .${classes.root}`]: {
    borderBottom: `1px solid ${theme.palette.gray.secondary}`,
    marginBottom: theme.spacing(2),
  },

  [`& .${classes.indicator}`]: {
    backgroundColor: theme.palette.highlight.primary,
  },

  [`& .${classes.root2}`]: {
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

  [`& .${classes.selected}`]: {},
}));

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

const CustomTabs = Tabs;

const CustomTab = styled(Tab)(({ theme }) => ({
  [`& .${classes.root2}`]: {
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

  [`& .${classes.selected}`]: {},
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
        classes={{
          root: classes.root,
          indicator: classes.indicator,
        }}
      >
        {Object.keys(TabDetails).map((key) => (
          <CustomTab
            key={key}
            label={TabDetails[key].label}
            value={key}
            disabled={isLoadingData}
            classes={{
              root: classes.root2,
              selected: classes.selected,
            }}
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
                  This participant has already been assigned a cohort. To reassign the cohort,
                  please click on 'Withdraw Cohort' to withdraw them first.
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
    <StyledGrid
      container
      alignContent='flex-start'
      justifyContent='flex-start'
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
    </StyledGrid>
  );
};
