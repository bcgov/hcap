import React, { useEffect, useState } from 'react';
import _orderBy from 'lodash/orderBy';
import { useHistory, useLocation, Redirect } from 'react-router-dom';
import Grid from '@material-ui/core/Grid';
import { Box, Typography } from '@material-ui/core';
import { Button, Page, Table } from '../../components/generic';
import { Routes } from '../../constants';

export default () => {

  const [order, setOrder] = useState('asc');
  const [rows, setRows] = useState([]);
  const [columns] = useState([
    { id: 'id', name: 'ID' },
    { id: 'status', name: 'Status' },
    { id: 'message', name: 'Message' },
  ]);
  const history = useHistory();
  const location = useLocation();
  if (!location.state) return <Redirect to={Routes.ApplicantUpload} />

  const [orderBy, setOrderBy] = useState(columns[0].id);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortConfig = () => {
    return [orderBy, 'id'];
  };

  const sort = (array) => _orderBy(array, sortConfig(), [order]);

  useEffect(() => {
    const insertMissingMessage = (row) => row.message ? row : {...row, message: ''};
    setRows(location.state?.results.map(insertMissingMessage) || []);
  }, [location]);

  return (
    <Page>
      <Grid container alignContent="center" justify="center" alignItems="center" direction="column">
        <Box pt={4} pb={4} pl={2} pr={2}>
          <Typography variant="subtitle1" gutterBottom>
            Applicant Upload Results
          </Typography>
        </Box>
        <Box pb={4} pl={2} pr={2}>
          <Button
              onClick={() => history.push(Routes.ApplicantUpload)}
              text="Return to Application Upload"
            />
        </Box>
        <Box pb={2} pl={2} pr={2} width="100%">
          <Table
            columns={columns}
            order={order}
            orderBy={orderBy}
            onRequestSort={handleRequestSort}
            rows={sort(rows)}
          />
        </Box>
      </Grid>
    </Page>
  );
};
