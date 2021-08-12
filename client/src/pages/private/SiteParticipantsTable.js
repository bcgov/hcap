import React, { useEffect, useState, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import _orderBy from 'lodash/orderBy';
import Grid from '@material-ui/core/Grid';
import { Box, Typography, Link } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import store from 'store';
import { Table, Button, Dialog } from '../../components/generic';
import { getDialogTitle } from '../../utils';
import { AuthContext, SiteDetailTabContext } from '../../providers';
import { fieldsLabelMap } from '../../constants';
import {
  ToastStatus,
  API_URL,
  makeToasts,
  ArchiveHiredParticipantSchema,
  participantStatus,
  Routes,
} from '../../constants';
import { ArchiveHiredParticipantForm } from '../../components/modal-forms';
import { useToast } from '../../hooks';
import moment from 'moment';
import { keyedString } from '../../utils';

let columnIDs = [
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

const fetchDetails = async (id) => {
  const response = await fetch(`${API_URL}/api/v1/employer-sites/${id}`, {
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
    },
    method: 'GET',
  });

  if (response.ok) {
    const site = await response.json();
    return site;
  } else {
    return {};
  }
};

export default ({ id, onArchiveParticipantAction }) => {
  const history = useHistory();
  const [order, setOrder] = useState('asc');
  const [isLoadingData, setLoadingData] = useState(false);
  const [actionMenuParticipant, setActionMenuParticipant] = useState(null);
  const [activeModalForm, setActiveModalForm] = useState(null);
  const [rows, setRows] = useState([]);
  const [fetchedRows, setFetchedRows] = useState([]);
  const [fetchedWithdrawnRows, setFetchedWithdrawnRows] = useState([]);
  const { auth } = AuthContext.useAuth();
  const { openToast } = useToast();
  const roles = useMemo(() => auth.user?.roles || [], [auth.user]);
  const defaultOnClose = () => {
    setActiveModalForm(null);
    setActionMenuParticipant(null);
  };

  const {
    state: { columns, selectedTab, site },
    dispatch,
  } = SiteDetailTabContext.useTabContext();

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
      payload: { tab: tabs[0], roles },
    });
  }, [dispatch, roles]);

  const [orderBy, setOrderBy] = useState(columns[4]?.id || 'participantName');
  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sort = (array) => _orderBy(array, [orderBy, 'operatorName'], [order]);

  const forceReload = async () => {
    setLoadingData(true);
    const response = await fetch(`${API_URL}/api/v1/employer-sites/${id}/participants`, {
      headers: { Authorization: `Bearer ${store.get('TOKEN')}` },
      method: 'GET',
    });

    if (response.ok) {
      const { hired, withdrawn } = await response.json();
      const mapToData = (response) => {
        return response.map((row) => {
          // Pull all relevant props from row based on columns constant
          const values = {
            participantId: row.participant_id,
            participantName: `${row.participantJoin.body.firstName} ${row.participantJoin.body.lastName}`,
            hiredDate: row.data.hiredDate,
            startDate: row.data.startDate,
            withdrawnDate: row.data?.endDate,
            reason: row.data?.reason,
            nonHCAP: row.data.nonHcapOpportunity,
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
      const rowsData = mapToData(hired);
      const withdrawnRowsData = mapToData(withdrawn);
      setFetchedRows(rowsData);
      setFetchedWithdrawnRows(withdrawnRowsData);
    } else {
      setRows([]);
      setFetchedRows([]);
      setFetchedWithdrawnRows([]);
    }
    setLoadingData(false);
  };

  useEffect(() => {
    const fetchParticipants = async () => {
      setLoadingData(true);
      const response = await fetch(`${API_URL}/api/v1/employer-sites/${id}/participants`, {
        headers: { Authorization: `Bearer ${store.get('TOKEN')}` },
        method: 'GET',
      });

      if (response.ok) {
        const { hired, withdrawn } = await response.json();

        const mapToData = (response) => {
          return response.map((row) => {
            // Pull all relevant props from row based on columns constant
            const values = {
              participantId: row.participant_id,
              participantName: `${row.participantJoin.body.firstName} ${row.participantJoin.body.lastName}`,
              hiredDate: row.data.hiredDate,
              startDate: row.data.startDate,
              withdrawnDate: row.data.endDate,
              reason: row.data.reason,
              nonHCAP: row.data.nonHcapOpportunity,
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
        const rowsData = mapToData(hired);
        const withdrawnRowsData = mapToData(withdrawn);
        setFetchedRows(rowsData);
        setFetchedWithdrawnRows(withdrawnRowsData);
      } else {
        setRows([]);
        setFetchedRows([]);
        setFetchedWithdrawnRows([]);
      }
      setLoadingData(false);
    };

    fetchParticipants();
  }, [id, setRows, setFetchedRows, setFetchedWithdrawnRows, setLoadingData]);

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
        site: parseInt(id),
        data: additional,
        status: 'archived',
      }),
    });

    if (response.ok) {
      const index = rows.findIndex((row) => row.participantId === participantId);
      const { participantName } = rows[index];
      const toasts = makeToasts(participantName, '');
      openToast(toasts[participantStatus.ARCHIVED]);
      setActionMenuParticipant(null);
      setActiveModalForm(null);
      forceReload();
    } else {
      openToast({
        status: ToastStatus.Error,
        message: response.error || response.statusText || 'Server error',
      });
    }
  };

  useEffect(() => {
    setRows(selectedTab === 'Hired Participants' ? fetchedRows : fetchedWithdrawnRows);
  }, [fetchedRows, fetchedWithdrawnRows, selectedTab]);

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
              tabs.map((key) => (
                <CustomTab key={key} label={key} value={key} disabled={isLoadingData} />
              )) // Tab component with tab name as value
            }
          </CustomTabs>
          {selectedTab === 'Site Details' ? (
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
          ) : (
            <Table
              columns={columns}
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
              rows={sort(rows)}
              isLoading={isLoadingData}
              renderCell={(columnId, row) => {
                const isEmployer = roles.includes('health_authority') || roles.includes('employer');
                if (
                  columnId === 'participantName' &&
                  isEmployer &&
                  selectedTab === 'Hired Participants'
                ) {
                  return (
                    <Link
                      component='button'
                      variant='body2'
                      onClick={() => {
                        const { participantId: id } = row;
                        const participantDetailsPath = keyedString(Routes.ParticipantDetails, {
                          id,
                          page: 'site-details',
                        });
                        history.push(participantDetailsPath);
                      }}
                    >
                      {row[columnId]}
                    </Link>
                  );
                }
                if (columnId === 'phoneNumber') {
                  const num = String(row['phoneNumber']);
                  return `(${num.substr(0, 3)}) ${num.substr(3, 3)}-${num.substr(6, 4)}`;
                }
                if (columnId === 'status') {
                  const status = String(row['status']);
                  return `${status.substring(0, 1).toUpperCase()}${status.substring(1)}`;
                }
                if (columnId === 'nonHCAP') {
                  return row[columnId] ? 'Non-HCAP' : 'HCAP';
                }
                if (columnId === 'archive') {
                  return (
                    <Button
                      onClick={async () => {
                        // Get data from row.participantId
                        const response = await fetch(
                          `${API_URL}/api/v1/participant?id=${row.participantId}`,
                          {
                            headers: {
                              Accept: 'application/json',
                              'Content-type': 'application/json',
                              Authorization: `Bearer ${store.get('TOKEN')}`,
                            },
                            method: 'GET',
                          }
                        );
                        const participant = await response.json();
                        setActionMenuParticipant(participant[0]);
                        setActiveModalForm('archive');
                      }}
                      variant='outlined'
                      size='small'
                      text='Archive'
                    />
                  );
                }
                return row[columnId];
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
              endDate: moment().format('YYYY/MM/DD'),
              rehire: '',
              confirmed: false,
            }}
            validationSchema={ArchiveHiredParticipantSchema}
            onSubmit={async (values) => {
              await handleArchive(actionMenuParticipant.id, values);
              if (onArchiveParticipantAction) {
                onArchiveParticipantAction();
              } else {
                forceReload();
              }
            }}
            onClose={defaultOnClose}
          />
        )}
      </Dialog>
    </Grid>
  );
};
