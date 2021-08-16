import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Button } from '@material-ui/core';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';

import { dateToString } from '../../utils';

const useStyles = makeStyles({
  table: {
    minWidth: 660,
  },
});

export default function CohortTable({ rows, assignAction }) {
  const classes = useStyles();
  return (
    <TableContainer component={Paper}>
      <Table className={classes.table} aria-label='simple table'>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.cohort_name}</TableCell>
              <TableCell align='right'>{row.cohort_size}</TableCell>
              <TableCell align='right'>{dateToString(row.start_date)}</TableCell>
              <TableCell align='right'>
                <Button variant='outlined' color='secondary' onClick={() => assignAction(row)}>
                  Assign
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
