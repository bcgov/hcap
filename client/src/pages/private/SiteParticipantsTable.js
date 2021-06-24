import React, { useEffect, useState } from 'react';
import _orderBy from 'lodash/orderBy';
import Grid from '@material-ui/core/Grid';
import { Box } from '@material-ui/core';
import store from 'store';
import { Table, Button, Dialog } from '../../components/generic';
import { checkPermissions, getDialogTitle } from '../../utils';
import { AuthContext } from '../../providers';
import { ToastStatus, API_URL, makeToasts, ArchiveHiredParticipantSchema } from '../../constants';
import { ArchiveHiredParticipantForm } from '../../components/modal-forms';
import { useToast } from '../../hooks';
import moment from 'moment';

let columns = [
  { id: 'participantId', name: 'ID' },
  { id: 'participantName', name: 'Name' },
  { id: 'hiredDate', name: 'Hire Date' },
  { id: 'startDate', name: 'Start Date' },
  { id: 'nonHCAP', name: 'Position' },
  { id: 'archive', name: 'Archive' },
];

export default ({ siteId }) => {
  const [order, setOrder] = useState('asc');
  const [isLoadingData, setLoadingData] = useState(false);
  const [isPendingRequests, setIsPendingRequests] = useState(true);
  const [actionMenuParticipant, setActionMenuParticipant] = useState(null);
  const [activeModalForm, setActiveModalForm] = useState(null);
  const [rows, setRows] = useState([]);
  const [fetchedRows, setFetchedRows] = useState([]);
  const { auth } = AuthContext.useAuth();
  const { openToast } = useToast();
  const roles = auth.user?.roles || [];
  const isHA = checkPermissions(roles, ['health_authority']);
  if (!isHA) {
    columns = columns.filter((col) => col.id !== 'archived');
  }
  const defaultOnClose = () => {
    setActiveModalForm(null);
    setActionMenuParticipant(null);
  };
  const [orderBy, setOrderBy] = useState(columns[4].id);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sort = (array) => _orderBy(array, [orderBy, 'operatorName'], [order]);

  const forceReload = async () => {
    setLoadingData(true);
    const response = await fetch(`${API_URL}/api/v1/employer-sites/${siteId}/participants`, {
      headers: { Authorization: `Bearer ${store.get('TOKEN')}` },
      method: 'GET',
    });

    if (response.ok) {
      const participants = await response.json();
      const rowsData = participants.map((row) => {
        // Pull all relevant props from row based on columns constant
        const values = {
          participantId: row.participant_id,
          participantName: `${row.participantJoin.body.firstName} ${row.participantJoin.body.lastName}`,
          hiredDate: row.data.hiredDate,
          startDate: row.data.startDate,
          nonHCAP: row.data.nonHcapOpportunity,
        };

        const mappedRow = columns.reduce(
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
      setFetchedRows(rowsData);
      setIsPendingRequests(rowsData.length > 0);
    } else {
      setRows([]);
      setFetchedRows([]);
      setIsPendingRequests(false);
    }
    setLoadingData(false);
  };

  useEffect(() => {
    const fetchParticipants = async () => {
      setLoadingData(true);
      const response = await fetch(`${API_URL}/api/v1/employer-sites/${siteId}/participants`, {
        headers: { Authorization: `Bearer ${store.get('TOKEN')}` },
        method: 'GET',
      });

      if (response.ok) {
        const participants = await response.json();
        const rowsData = participants.map((row) => {
          // Pull all relevant props from row based on columns constant
          const values = {
            participantId: row.participant_id,
            participantName: `${row.participantJoin.body.firstName} ${row.participantJoin.body.lastName}`,
            hiredDate: row.data.hiredDate,
            startDate: row.data.startDate,
            nonHCAP: row.data.nonHcapOpportunity,
          };

          const mappedRow = columns.reduce(
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
        setFetchedRows(rowsData);
        setIsPendingRequests(rowsData.length > 0);
      } else {
        setRows([]);
        setFetchedRows([]);
        setIsPendingRequests(false);
      }
      setLoadingData(false);
    };

    fetchParticipants();
  }, [siteId]);

  const handleEngage = async (participantId, status, additional = {}) => {
    const response = await fetch(`${API_URL}/api/v1/employer-actions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${store.get('TOKEN')}`,
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify({ participantId, status, data: additional }),
    });

    if (response.ok) {
      const index = rows.findIndex((row) => row.participantId === participantId);
      const { participantName } = rows[index];
      const toasts = makeToasts(participantName, '');
      openToast(toasts['archived']);
      setActionMenuParticipant(null);
      setActiveModalForm(null);
    } else {
      openToast({
        status: ToastStatus.Error,
        message: response.error || response.statusText || 'Server error',
      });
    }
  };

  useEffect(() => {
    setRows(fetchedRows);
  }, [fetchedRows]);

  return (
    <Grid
      container
      alignContent='flex-start'
      justify='flex-start'
      alignItems='center'
      direction='column'
    >
      {isPendingRequests && (
        <Box pt={2} pb={2} pl={2} pr={2} width='100%'>
          <Table
            columns={columns}
            order={order}
            orderBy={orderBy}
            onRequestSort={handleRequestSort}
            rows={sort(rows)}
            isLoading={isLoadingData}
            renderCell={(columnId, row) => {
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
        </Box>
      )}
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
              confirmed: false,
            }}
            validationSchema={ArchiveHiredParticipantSchema}
            onSubmit={(values) => {
              handleEngage(actionMenuParticipant.id, 'archived', values);
              forceReload();
            }}
            onClose={defaultOnClose}
          />
        )}
      </Dialog>
    </Grid>
  );
};
