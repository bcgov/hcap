import React, { useEffect, useMemo, useState } from 'react';

import { Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { Table, Button, CheckPermissions } from '../../components/generic';

import dayjs from 'dayjs';

import { sortObjects } from '../../utils';
import { AuthContext } from '../../providers';
import { fetchPhases } from '../../services/phases';

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

const columns = [
  { id: 'name', name: 'Phase Name' },
  { id: 'start_date', name: 'Start Date' },
  { id: 'end_date', name: 'End Date' },
  // { id: 'edit'},  // Commented out until implemented
];

export default ({ phases }) => {
  const classes = useStyles();
  const [order, setOrder] = useState('asc');
  const [isLoadingData, setLoadingData] = useState(false);
  const [isPendingRequests, setIsPendingRequests] = useState(true);
  const [rows, setRows] = useState([]);
  const [orderBy, setOrderBy] = useState('phaseName');
  const { auth } = AuthContext.useAuth();
  const roles = useMemo(() => auth.user?.roles || [], [auth.user]);

  const handleRequestSort = (_, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const fetchData = async () => {
    setLoadingData(true);
    const rowsData = await fetchPhases(columns);

    setRows(rowsData);
    setIsPendingRequests(rowsData.length > 0);
    setLoadingData(false);
  };

  const sort = (array) => sortObjects(array, orderBy, order);

  useEffect(() => {
    if (phases) {
      setRows(phases);
    } else {
      fetchData();
    }
  }, [phases]);

  return (
    <>
      <Grid
        container
        alignContent='flex-start'
        justify='flex-start'
        alignItems='center'
        direction='row'
      >
        <CheckPermissions roles={roles} permittedRoles={['ministry_of_health']}>
          <Grid item xs={8} />
        </CheckPermissions>

        {roles.includes('superuser') && <Grid item xs={8} />}

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
                if (columnId === 'start_date' || columnId === 'end_date')
                  return dayjs.utc(row[columnId]).format('MMM DD, YYYY');
                if (columnId === 'edit')
                  return <Button variant='outlined' size='small' text='Edit' />;
                return row[columnId];
              }}
            />
          </Grid>
        )}
      </Grid>
    </>
  );
};
