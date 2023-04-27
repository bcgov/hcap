import React, { useEffect, useState, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import Grid from '@material-ui/core/Grid';
import { Box, Typography, Link } from '@material-ui/core';
import {
  Table,
  Button,
  Dialog,
  CustomTab,
  CustomTabs,
  CheckPermissions,
} from '../../components/generic';
import { AuthContext, SiteDetailTabContext } from '../../providers';
import { fetchUserNotifications } from '../../services';
import { archiveParticipant, fetchParticipantById } from '../../services/participant';
import {
  ToastStatus,
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

export default ({ id, siteId, fetchDetails, isLoading }) => {
  const history = useHistory();
  const [order, setOrder] = useState('asc');
  const [actionMenuParticipant, setActionMenuParticipant] = useState(null);
  const [activeModalForm, setActiveModalForm] = useState(null);
  const [rows, setRows] = useState([]);
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

  const archiveOnClick = async (participantId) => {
    const participant = await fetchParticipantById(participantId);

    setActionMenuParticipant(participant[0]);
    setActiveModalForm('archive');
  };

  useEffect(() => {
    dispatch({
      type: SiteDetailTabContext.types.LOAD_SITE,
      payload: {},
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

  const handleArchive = async (participantId, additional = {}) => {
    const response = await archiveParticipant(participantId, siteId, additional);

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
      await fetchDetails();
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
                <CustomTab key={title} label={title} value={title} disabled={isLoading} />
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
              isLoading={isLoading}
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
            <Table
              columns={columns}
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
              rows={sort(rows)}
              isLoading={isLoading}
              renderCell={(columnId, row) => {
                if (columnObj(columnId).isHidden) return;
                if (columnId === 'details')
                  return (
                    <CheckPermissions roles={roles} permittedRoles={['ministry_of_health']}>
                      <SetAllocation
                        isNew={row.allocation === null}
                        row={row}
                        siteId={id}
                        fetchDetails={fetchDetails}
                      />
                    </CheckPermissions>
                  );
                return row[columnId] ?? 'N/A';
              }}
            />
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
