import React, { useEffect, useState } from 'react';
import _orderBy from 'lodash/orderBy';
import Grid from '@material-ui/core/Grid';
import { Box } from '@material-ui/core';
import store from 'store';
import { Table } from '../../components/generic';
import { API_URL } from '../../constants';

const columns = [
  { id: 'participantId', name: 'ID' },
  { id: 'participantName', name: 'Name' },
  { id: 'hiredDate', name: 'Hire Date' },
  { id: 'startDate', name: 'Start Date' },
  { id: 'nonHCAP', name: 'Position' },
];

export default ({ siteId }) => {
  const [order, setOrder] = useState('asc');
  const [isLoadingData, setLoadingData] = useState(false);
  const [isPendingRequests, setIsPendingRequests] = useState(true);
  const [rows, setRows] = useState([]);
  const [fetchedRows, setFetchedRows] = useState([]);

  const [orderBy, setOrderBy] = useState(columns[4].id);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sort = (array) => _orderBy(array, [orderBy, 'operatorName'], [order]);

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
              return row[columnId];
            }}
          />
        </Box>
      )}
    </Grid>
  );
};
