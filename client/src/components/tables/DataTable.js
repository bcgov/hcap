import React, { useCallback, useEffect, useState } from 'react';

import { Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { Table, Button } from '../../components/generic';

import dayjs from 'dayjs';

import { sortObjects } from '../../utils';

const useStyles = makeStyles((theme) => ({
  rootItem: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
  },
  tableItem: {
    paddingTop: theme.spacing(4),
    paddingRight: theme.spacing(2),
    paddingBottom: theme.spacing(4),
    paddingLeft: theme.spacing(2),
  },
  filterLabel: {
    color: theme.palette.gray.dark,
    fontWeight: 700,
  },
  actionMenuPaper: {
    minWidth: '220px',
  },
  menuItem: {
    padding: '.75rem',
    fontSize: '17px',
  },
}));

export default ({ columns, fetchData, data }) => {
  const classes = useStyles();
  const [order, setOrder] = useState('asc');
  const [isLoadingData, setLoadingData] = useState(false);
  const [isPendingRequests, setIsPendingRequests] = useState(true);
  const [rows, setRows] = useState([]);
  const [orderBy, setOrderBy] = useState('name');

  const handleRequestSort = (_, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const loadData = useCallback(async () => {
    setLoadingData(true);
    const rowsData = await fetchData(columns);

    setRows(rowsData);
    setIsPendingRequests(rowsData.length > 0);
    setLoadingData(false);
  }, [setRows, fetchData, columns]);

  const sort = (array) => sortObjects(array, orderBy, order);

  useEffect(() => {
    if (data) {
      setRows(data);
    } else {
      loadData();
    }
  }, [data, loadData]);

  const types = Object.fromEntries(columns.map((column) => [column.id, column.type]));

  const buttonLabels = Object.fromEntries(columns.map((column) => [column.id, column.buttonLabel]));

  return (
    <>
      <Grid
        container
        alignContent='flex-start'
        justify='flex-start'
        alignItems='center'
        direction='row'
      >
        {isPendingRequests && (
          <Grid className={classes.tableItem} item xs={12}>
            <Table
              columns={columns}
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
              rows={sort(rows)}
              isLoading={isLoadingData}
              renderCell={(columnId, row) => {
                if (types[columnId] === 'date')
                  return dayjs.utc(row[columnId]).format('MMM DD, YYYY');
                if (types[columnId] === 'button')
                  return <Button variant='outlined' size='small' text={buttonLabels[columnId]} />;
                return row[columnId];
              }}
            />
          </Grid>
        )}
      </Grid>
    </>
  );
};
