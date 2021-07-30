import React, { useEffect, useMemo, useState } from 'react';
import _orderBy from 'lodash/orderBy';
import { useHistory } from 'react-router-dom';
import Grid from '@material-ui/core/Grid';
import { Box, Typography, Link } from '@material-ui/core';
import { Table, Button } from '../../components/generic';
import { Routes, regionLabelsMap } from '../../constants';
import { TableFilter } from '../../components/generic/TableFilter';
import { AuthContext } from '../../providers';

const columns = [
  { id: 'institute_name', name: 'Institutes' },
  { id: 'health_authority', name: 'Health Authority' },
  { id: 'cohorts', name: 'Cohorts' },
  { id: 'available_seats', name: 'Available Seats' },
  { id: 'postal_code', name: 'Postal Code' },
  { id: 'addCohort' },
];

export default ({ PSIs, handleAddCohortClick }) => {
  const [order, setOrder] = useState('asc');
  const [rows, setRows] = useState([]);

  const [orderBy, setOrderBy] = useState('institute_name');
  const [healthAuthorities, setHealthAuthorities] = useState([
    'Interior',
    'Fraser',
    'Vancouver Coastal',
    'Vancouver Island',
    'Northern',
    'None',
  ]);
  const { auth } = AuthContext.useAuth();
  const roles = useMemo(() => auth.user?.roles || [], [auth.user]);

  const history = useHistory();

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  useEffect(() => {
    setRows(PSIs.filter((row) => healthAuthorities.includes(row.health_authority)));
  }, [PSIs, healthAuthorities]);

  useEffect(() => {
    setHealthAuthorities(
      roles.includes('superuser') || roles.includes('ministry_of_health')
        ? Object.values(regionLabelsMap)
        : roles.map((loc) => regionLabelsMap[loc]).filter(Boolean)
    );
  }, [roles]);

  const sort = (array) => _orderBy(array, [orderBy, 'operatorName'], [order]);

  return (
    <>
      <Grid
        container
        alignContent='flex-start'
        justify='flex-start'
        alignItems='center'
        direction='column'
      >
        <Grid
          container
          alignContent='flex-start'
          justify='flex-start'
          alignItems='center'
          direction='row'
        >
          <Grid item>
            <Box pl={2} pr={2} pt={1}>
              <Typography variant='body1' gutterBottom>
                Filter:
              </Typography>
            </Box>
          </Grid>
          <Grid item>
            <Box minWidth={180}>
              <TableFilter
                onFilter={(filteredRows) => setRows(filteredRows)}
                values={healthAuthorities}
                rows={PSIs}
                label='Health Authority'
                filterField='health_authority'
              />
            </Box>
          </Grid>
        </Grid>
        <Box pt={2} pb={2} pl={2} pr={2} width='100%'>
          <Table
            columns={columns}
            order={order}
            orderBy={orderBy}
            onRequestSort={handleRequestSort}
            rows={sort(rows)}
            isLoading={false}
            renderCell={(columnId, row) => {
              if (columnId === 'institute_name')
                return (
                  <Link onClick={() => history.push(Routes.PSIView + `/${row.id}`)}>
                    {row.institute_name}
                  </Link>
                );
              if (columnId === 'addCohort')
                return (
                  <Button
                    onClick={() => handleAddCohortClick(row.id)}
                    variant='outlined'
                    size='small'
                    text='+ Add Cohort'
                  />
                );
              return row[columnId];
            }}
          />
        </Box>
      </Grid>
    </>
  );
};
