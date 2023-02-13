import React, { useEffect, useState, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import Grid from '@material-ui/core/Grid';
import { Box, Typography, Link } from '@material-ui/core';
import store from 'store';
import { Table, Button, Dialog, CustomTab, CustomTabs } from '../../components/generic';
import { AuthContext, SiteDetailTabContext } from '../../providers';
import {
  FeatureFlaggedComponent,
  flagKeys,
  fetchUserNotifications,
  featureFlag,
} from '../../services';
import {
  ToastStatus,
  API_URL,
  makeToasts,
  ArchiveHiredParticipantSchema,
  participantStatus,
  Routes,
  fieldsLabelMap,
} from '../../constants';
import { ArchiveHiredParticipantForm } from '../../components/modal-forms';
import { useToast } from '../../hooks';
import dayjs from 'dayjs';
import { keyedString, getDialogTitle, sortObjects } from '../../utils';
import { fetchSitePhases } from '../../services/phases';
import { SetPhaseAllocations } from './SetPhaseAllocations';

const columnIDs = [
  { id: 'participantId', name: 'ID' },
  { id: 'participantName', name: 'Name' },
  { id: 'hiredDate', name: 'Hire Date' },
  { id: 'startDate', name: 'Start Date' },
  { id: 'nonHCAP', name: 'Position' },
  { id: 'archive', name: 'Archive' },
  { id: 'withdrawnDate', name: 'Withdrawn Date' },
  { id: 'reason', name: 'Reason' },
];

const tabs = SiteDetailTabContext.tabs;

const fetchDetails = async (id) => {
  const response = await fetch(`${API_URL}/api/v1/employer-sites/${id}`, {
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
    },
    method: 'GET',
  });

  if (response.ok) {
    const site = await response.json();
    if (featureFlag(flagKeys.FEATURE_PHASE_ALLOCATION)) {
      const phases = await fetchSitePhases(site.id);

      console.log('phases', phases);

      const currentPhase = phases.find((phase) => {
        return dayjs().isBetween(phase.startDate, phase.endDate, null, '()');
      });

      return { ...site, ...currentPhase, phases: phases };
    } else {
      return { ...site, phases: [] };
    }
  } else {
    return {};
  }
};

const fetchParticipants = async (siteId) => {
  const response = await fetch(`${API_URL}/api/v1/employer-sites/${siteId}/participants`, {
    headers: { Authorization: `Bearer ${store.get('TOKEN')}` },
    method: 'GET',
  });

  if (response.ok) {
    const { hired, withdrawn } = await response.json();
    const hiredRowsData = mapDataToRow(hired);
    const withdrawnRowsData = mapDataToRow(withdrawn);
    return { hiredRowsData, withdrawnRowsData };
  } else {
    return { hiredRowsData: [], withdrawnRowsData: [] };
  }
};

/**
 * Takes the data from the db and formats it for the table
 * @param {*} response: raw data from API call
 * @returns
 */
const mapDataToRow = (response) => {
  return response.map((row) => {
    // Pull all relevant props from row based on columns constant
    const values = {
      participantId: row.participant_id,
      participantName: `${row.participantJoin.body.firstName} ${row.participantJoin.body.lastName}`,
      hiredDate: row.data.hiredDate,
      startDate: row.data.startDate,
      withdrawnDate: row.data.endDate,
      reason: row.data.reason,
      nonHCAP: row.data.nonHcapOpportunity ? 'Non-HCAP' : 'HCAP',
    };

    const mappedRow = columnIDs.reduce(
      (accumulator, column) => ({
        ...accumulator,
        [column.id]: values[column.id],
      }),
      {}
    );
    // Add additional props (user ID, button) to row
    return {
      ...mappedRow,
      id: row.id,
    };
  });
};

export default ({ id, siteId }) => {
  const history = useHistory();
  const [order, setOrder] = useState('asc');
  const [isLoadingData, setLoadingData] = useState(false);
  const [actionMenuParticipant, setActionMenuParticipant] = useState(null);
  const [activeModalForm, setActiveModalForm] = useState(null);
  const [rows, setRows] = useState([]);
  const [fetchedHiredRows, setFetchedHiredRows] = useState([]);
  const [fetchedWithdrawnRows, setFetchedWithdrawnRows] = useState([]);
  const { auth, dispatch: authDispatch } = AuthContext.useAuth();
  const { openToast } = useToast();
  const roles = useMemo(() => auth.user?.roles || [], [auth.user]);
  const defaultOnClose = () => {
    setActiveModalForm(null);
    setActionMenuParticipant(null);
  };

  const isEmployer = roles.includes('health_authority') || roles.includes('employer');

  const {
    state: { columns, selectedTab, site },
    dispatch,
  } = SiteDetailTabContext.useTabContext();

  const [orderBy, setOrderBy] = useState(columns[4]?.id || 'participantName');

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sort = (array) => sortObjects(array, orderBy, order);

  const participantOnClick = (participantId) => {
    const participantDetailsPath = keyedString(Routes.ParticipantDetails, {
      id: participantId,
      page: 'site-details',
      pageId: id,
    });
    history.push(participantDetailsPath);
  };

  const archiveOnClick = async (participantId) => {
    // Get data from row.participantId
    const response = await fetch(`${API_URL}/api/v1/participant?id=${participantId}`, {
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
        Authorization: `Bearer ${store.get('TOKEN')}`,
      },
      method: 'GET',
    });
    const participant = await response.json();
    setActionMenuParticipant(participant[0]);
    setActiveModalForm('archive');
  };

  useEffect(() => {
    dispatch({
      type: SiteDetailTabContext.types.LOAD_SITE,
      payload: {},
    });
    fetchDetails(id).then((response) => {
      dispatch({
        type: SiteDetailTabContext.types.UPDATE_SITE,
        payload: { site: response },
      });
    });
  }, [dispatch, id]);

  useEffect(() => {
    dispatch({
      type: SiteDetailTabContext.types.SELECT_TAB,
      payload: { tab: tabs.SITE_DETAILS, roles },
    });
  }, [dispatch, roles, siteId]);

  useEffect(() => {
    switch (selectedTab) {
      case tabs.HIRED_PARTICIPANTS:
        setRows(fetchedHiredRows);
        return;
      case tabs.WITHDRAWN_PARTICIPANTS:
        setRows(fetchedWithdrawnRows);
        return;
      case tabs.ALLOCATION:
        setRows(site.phases);
        return;
      default:
        return;
    }
  }, [fetchedHiredRows, fetchedWithdrawnRows, site.phases, selectedTab]);

  useEffect(() => {
    console.log('IS THIS DIFFERENT!?');
    console.log(site.phases);
    setRows(site.phases);
  }, [site]);

  useEffect(() => {
    setLoadingData(true);
    fetchParticipants(siteId).then(({ hiredRowsData, withdrawnRowsData }) => {
      setFetchedHiredRows(hiredRowsData);
      setFetchedWithdrawnRows(withdrawnRowsData);
      setLoadingData(false);
    });
  }, [siteId, setRows, setFetchedHiredRows, setFetchedWithdrawnRows, setLoadingData]);

  const handleArchive = async (participantId, additional = {}) => {
    const response = await fetch(`${API_URL}/api/v1/employer-actions/archive`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${store.get('TOKEN')}`,
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify({
        participantId,
        site: siteId,
        data: additional,
        status: 'archived',
      }),
    });

    if (response.ok) {
      const dispatchFunction = (notifications) =>
        authDispatch({ type: AuthContext.USER_NOTIFICATIONS_UPDATED, payload: notifications });
      fetchUserNotifications(dispatchFunction);

      const index = rows.findIndex((row) => row.participantId === participantId);
      const { participantName } = rows[index];
      const toasts = makeToasts(participantName, '');

      openToast(toasts[participantStatus.ARCHIVED]);
      setActionMenuParticipant(null);
      setActiveModalForm(null);
      // this is to make sure site's HCAP hires get updated on archiving as duplicate
      fetchDetails(id).then((resp) => {
        dispatch({
          type: SiteDetailTabContext.types.UPDATE_SITE,
          payload: { site: resp },
        });
      });
      // and this is to update both lists of participants
      fetchParticipants(siteId).then(({ hiredRowsData, withdrawnRowsData }) => {
        setFetchedHiredRows(hiredRowsData);
        setFetchedWithdrawnRows(withdrawnRowsData);
      });
    } else {
      openToast({
        status: ToastStatus.Error,
        message: response.error || response.statusText || 'Server error',
      });
    }
  };

  const columnObj = (rowId) => columns.find(({ id }) => id === rowId);
  return (
    <Grid
      container
      alignContent='flex-start'
      justify='flex-start'
      alignItems='center'
      direction='column'
    >
      {
        <Box pt={2} pb={2} pl={2} pr={2} width='100%'>
          <CustomTabs
            value={selectedTab || false}
            onChange={(_, property) =>
              dispatch({
                type: SiteDetailTabContext.types.SELECT_TAB,
                payload: { tab: property, roles },
              })
            }
          >
            {
              Object.values(tabs).map((title) => (
                <CustomTab key={title} label={title} value={title} disabled={isLoadingData} />
              )) // Tab component with tab name as value
            }
          </CustomTabs>
          {selectedTab === tabs.SITE_DETAILS && (
            <Grid container>
              {Object.keys(fieldsLabelMap).map((title) => (
                <Grid key={title} item xs={12} sm={6} xl={3} style={{ marginBottom: 40 }}>
                  <Box pr={2} pl={2}>
                    <Box pb={2}>
                      <Typography variant='subtitle1'>
                        <b>{title}</b>
                      </Typography>
                    </Box>
                    {Object.keys(fieldsLabelMap[title]).map((subTitle) => (
                      <Grid key={subTitle} container style={{ marginBottom: 5 }}>
                        <Grid item xs={12}>
                          <Box pr={4} pb={1}>
                            <Typography variant='body1'>
                              <b>{subTitle}</b>
                            </Typography>
                            <Typography variant='body1'>
                              {site[fieldsLabelMap[title][subTitle]]}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    ))}
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
          {[tabs.HIRED_PARTICIPANTS, tabs.WITHDRAWN_PARTICIPANTS].includes(selectedTab) && (
            <Table
              columns={columns}
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
              rows={sort(rows)}
              isLoading={isLoadingData}
              renderCell={(columnId, row) => {
                switch (columnId) {
                  case 'participantName':
                    if (isEmployer && selectedTab === tabs.HIRED_PARTICIPANTS) {
                      return (
                        <Link
                          component='button'
                          variant='body2'
                          onClick={() => participantOnClick(row.participantId)}
                        >
                          {row[columnId]}
                        </Link>
                      );
                    }
                    return row[columnId];
                  case 'archive':
                    return (
                      <Button
                        onClick={() => archiveOnClick(row.participantId)}
                        variant='outlined'
                        size='small'
                        text='Archive'
                      />
                    );
                  default:
                    return row[columnId] ?? 'N/A';
                }
              }}
            />
          )}
          {selectedTab === tabs.ALLOCATION && (
            <FeatureFlaggedComponent featureKey={flagKeys.FEATURE_PHASE_ALLOCATION}>
              <Table
                columns={columns}
                order={order}
                orderBy={orderBy}
                onRequestSort={handleRequestSort}
                rows={sort(rows)}
                isLoading={isLoadingData}
                renderCell={(columnId, row) => {
                  if (columnObj(columnId).isHidden) return;
                  if (columnId === 'details')
                    return (
                      <SetPhaseAllocations
                        isNew={row.allocation === null}
                        row={row}
                        siteId={id}
                        fetchDetails={fetchDetails}
                      />
                    );
                  return row[columnId] ?? 'N/A';
                }}
              />
            </FeatureFlaggedComponent>
          )}
        </Box>
      }
      <Dialog
        title={getDialogTitle(activeModalForm)}
        open={activeModalForm != null}
        onClose={defaultOnClose}
      >
        {activeModalForm === 'archive' && (
          <ArchiveHiredParticipantForm
            initialValues={{
              type: '',
              reason: '',
              status: '',
              endDate: dayjs().format('YYYY/MM/DD'),
              rehire: '',
              confirmed: false,
            }}
            validationSchema={ArchiveHiredParticipantSchema}
            onSubmit={async (values) => {
              await handleArchive(actionMenuParticipant.id, values);
            }}
            onClose={defaultOnClose}
            participant={actionMenuParticipant}
          />
        )}
      </Dialog>
    </Grid>
  );
};
