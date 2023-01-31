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

/**
 * @typedef {Object} buttonConfig
 * @property {string} label                    Button inner text.
 * @property {(row: object) => any?} callback  Callback function, passed the row that the click happened on.
 *
 * @typedef {Object} column
 * @property {string} id                       ID string for the column, e.g. `'start_date'`. Must match a property name in the target data.
 * @property {string} name                     Label for the column, e.g. `'Start Date'`
 * @property {undefined|'date'|'button'} type  Type of column, used for formatting.
 *                                             * `date` will format the column as a date, using a UTC ISO timestamp.
 *                                             * `button` will render a button (see the `button` property).
 * @property {buttonConfig?} button            Configuration for buttons, if `type` is `'button'`.
 */

// Data table component, renders arbitrary columns using a provided data fetching callback
/**
 * @param {object}   props
 * @param {column[]} props.columns
 * @param {function} props.fetchData
 * @returns {JSX.Element}
 */
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

  const buttonConfigs = Object.fromEntries(columns.map((column) => [column.id, column.button]));

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
                  return (
                    <Button
                      variant='outlined'
                      size='small'
                      text={buttonConfigs[columnId].label}
                      // Might be worth coalescing this, or eventually enforcing with TS,
                      // but for now throwing a runtime error for missing callback works.
                      onClick={() => buttonConfigs[columnId].callback(row)}
                    />
                  );
                return row[columnId];
              }}
            />
          </Grid>
        )}
      </Grid>
    </>
  );
};
