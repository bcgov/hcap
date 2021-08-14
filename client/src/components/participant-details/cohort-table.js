import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Button } from '@material-ui/core';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
// import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';

const useStyles = makeStyles({
  table: {},
});

function createData(name, seats, startDate) {
  return { name, seats, startDate };
}

const rows = [
  createData('Mid sem 2021', 159, '2021-06-21'),
  createData('End 2021', 237, '2021-09-11'),
];

export default function CohortTable() {
  const classes = useStyles();

  return (
    <TableContainer component={Paper}>
      <Table className={classes.table} aria-label='simple table'>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.name}>
              <TableCell>{row.name}</TableCell>
              <TableCell align='right'> </TableCell>
              <TableCell align='right'> </TableCell>
              <TableCell align='right'> </TableCell>
              <TableCell align='right'> </TableCell>
              <TableCell align='right'> </TableCell>
              <TableCell align='right'> </TableCell>
              <TableCell align='right'> </TableCell>
              <TableCell align='right'> </TableCell>
              <TableCell align='right'> </TableCell>

              <TableCell align='right'>{row.seats}</TableCell>
              <TableCell align='right'> </TableCell>
              <TableCell align='right'> </TableCell>
              <TableCell align='right'> </TableCell>
              <TableCell align='right'> </TableCell>
              <TableCell align='right'> </TableCell>
              <TableCell align='right'> </TableCell>
              <TableCell align='right'> </TableCell>
              <TableCell align='right'> </TableCell>
              <TableCell align='right'> </TableCell>
              <TableCell align='right'> </TableCell>
              <TableCell align='right'> </TableCell>
              <TableCell align='right'>{row.startDate}</TableCell>
              <TableCell align='right'>
                <Button variant='outlined' color='secondary'>
                  {' '}
                  Assign{' '}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
