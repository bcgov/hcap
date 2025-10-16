import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import Grid from '@mui/material/Grid';
import { Box, Typography, Link } from '@mui/material';
import { Table, Button } from '../../components/generic';
import { Routes } from '../../constants';
import { TableFilter } from '../../components/generic/TableFilter';
import { sortObjects } from '../../utils';

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
  const healthAuthorities = [
    'Interior',
    'Fraser',
    'Vancouver Coastal',
    'Vancouver Island',
    'Northern',
  ];
  const navigate = useNavigate();

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  useEffect(() => {
    setRows(
      PSIs.filter((row) =>
        ['Interior', 'Fraser', 'Vancouver Coastal', 'Vancouver Island', 'Northern'].includes(
          row.health_authority,
        ),
      ),
    );
  }, [PSIs]);

  const sort = (array) => sortObjects(array, orderBy, order);

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
                  <Link
                    onClick={() => navigate(Routes.PSIView + `/${row.id}`)}
                    sx={{ cursor: 'pointer' }}
                  >
                    {row.institute_name}
                  </Link>
                );
              if (columnId === 'addCohort')
                return (
                  <Button
                    onClick={() => handleAddCohortClick(row.id)}
                    variant='outlined'
                    size='small'
                    startIcon={<AddIcon />}
                    text='Add Cohort'
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
