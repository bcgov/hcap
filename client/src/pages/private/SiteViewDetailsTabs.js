/* eslint-disable */
import React, { useEffect, useState, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import Grid from '@material-ui/core/Grid';
import { Box, Typography, Link } from '@material-ui/core';
import store from 'store';
import {
  Table,
  Button,
  Dialog,
  CustomTab,
  CustomTabs,
  CheckPermissions,
} from '../../components/generic';
import { AuthContext, SiteDetailTabContext } from '../../providers';
import { FeatureFlaggedComponent, flagKeys, fetchUserNotifications } from '../../services';
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
import { SetAllocation } from './SetAllocation';

const tabs = SiteDetailTabContext.tabs;

export default ({ id, siteId, fetchDetails, fetchParticipants }) => {
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

  const [orderBy, setOrderBy] = useState('startDate');

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

  // reset allocation table after allocations are created/edited
  const fetchAllocationDetails = () => {
    return fetchDetails().then((response) => {
      dispatch({
        type: SiteDetailTabContext.types.UPDATE_SITE,
        payload: { site: response },
      });
    });
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
    console.log('USE EFFECT, LOAD SITE, UPDATE SITE ');
    dispatch({
      type: SiteDetailTabContext.types.LOAD_SITE,
      payload: {},
    });
    // fetchDetails().then((response) => {
    //   dispatch({
    //     type: SiteDetailTabContext.types.UPDATE_SITE,
    //     payload: { site: response },
    //   });
    // });
  }, [dispatch, id]);

  useEffect(() => {
    console.log('USE EFFECT, SELECT TAB ');
    dispatch({
      type: SiteDetailTabContext.types.SELECT_TAB,
      payload: { tab: tabs.SITE_DETAILS, roles },
    });
  }, [dispatch, roles, siteId]);

  useEffect(() => {
    console.log('USE EFFECT, SELECT TAB');
    switch (selectedTab) {
      case tabs.HIRED_PARTICIPANTS:
        setOrderBy('startDate');
        setRows(site.hiredParticipants);
        return;
      case tabs.WITHDRAWN_PARTICIPANTS:
        setOrderBy('withdrawnDate');
        setRows(site.withdrawnParticipants);
        return;
      case tabs.ALLOCATION:
        setOrderBy('startDate');
        setRows(site.phases);
        return;
      default:
        return;
    }
  }, [site.hiredParticipants, site.withdrawnParticipants, site.phases, selectedTab]);

  // useEffect(() => {
  //   console.log("USE EFFECT, FETCH PARTICIPANTS")
  //   setLoadingData(true);
  //   fetchParticipants(siteId).then(({ hiredRowsData, withdrawnRowsData }) => {
  //     setFetchedHiredRows(hiredRowsData);
  //     setFetchedWithdrawnRows(withdrawnRowsData);
  //     setLoadingData(false);
  //   });
  // }, [siteId, setRows, setFetchedHiredRows, setFetchedWithdrawnRows, setLoadingData]);

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
      fetchDetails().then((resp) => {
        dispatch({
          type: SiteDetailTabContext.types.UPDATE_SITE,
          payload: { site: resp },
        });
      });
      // and this is to update both lists of participants
      // fetchParticipants(siteId).then(({ hiredRowsData, withdrawnRowsData }) => {
      //   setFetchedHiredRows(hiredRowsData);
      //   setFetchedWithdrawnRows(withdrawnRowsData);
      // });
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
                      <CheckPermissions roles={roles} permittedRoles={['ministry_of_health']}>
                        <SetAllocation
                          isNew={row.allocation === null}
                          row={row}
                          siteId={id}
                          fetchDetails={fetchAllocationDetails}
                        />
                      </CheckPermissions>
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
