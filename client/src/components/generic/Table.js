import React from 'react';
import MuiTable from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import Skeleton from '@material-ui/lab/Skeleton';
import { withStyles } from '@material-ui/core/styles';

import { Card } from './Card';

const StyledTableCell = withStyles((theme) => ({
  head: {
    ...theme.typography.body1,
    backgroundColor: theme.palette.common.white,
    color: '#333333',
  },
  body: {
    ...theme.typography.body1,
  }
}))(TableCell);

const StyledTableRow = withStyles((theme) => ({
  root: {
    '&:nth-child(1)': {
      borderTop: `2px solid ${theme.palette.secondary.main}`
    },
    '&:nth-of-type(odd)': {
      backgroundColor: '#FAFAFA',
    },
  },
}))(TableRow);

export const Table = ({ order, orderBy, onRequestSort, columns, rows, isLoading }) => {

  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  return (
    <Card noPadding>
      <MuiTable>
        <TableHead>
          <TableRow>
            {columns.map((column, index) => (
              <StyledTableCell key={index}>
                <TableSortLabel
                  active={orderBy === column.id}
                  direction={orderBy === column.id ? order : 'asc'}
                  onClick={createSortHandler(column.id)}>
                  {column.name}
                </TableSortLabel>
              </StyledTableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading ? [...Array(8)].map((_, i) => (
            <StyledTableRow key={i}>
              {[...Array(columns.length)].map((_, i) => (
                <StyledTableCell key={i}><Skeleton animation="wave" /></StyledTableCell>
              ))}
            </StyledTableRow>
          )) : rows.map((row, index) => (
            <StyledTableRow key={index}>
              {Object.keys(row).map((key) => (
                <StyledTableCell key={key}>{row[key]}</StyledTableCell>
              ))}
            </StyledTableRow>
          ))}
        </TableBody>
      </MuiTable>
    </Card>
  );
};
