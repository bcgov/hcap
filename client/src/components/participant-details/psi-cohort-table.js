import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import IconButton from '@material-ui/core/IconButton';
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';
import { Button } from '@material-ui/core';
import { formatCohortDate } from '../../utils';

const useStyles = makeStyles({
  root: {
    width: '100%',
    overflowX: 'auto',
  },
  table: {
    minWidth: 650,
  },
  innerRow: {
    widows: '100%',
    paddingLeft: '100px',
  },
});

const isDisabled = (endDate) => {
  const today = new Date();
  const end = new Date(endDate);
  return end < today;
};

const ExpandableTableRow = ({
  expand = false,
  children,
  assignAction,
  rows,
  expandComponent,
  psi,
  ...otherProps
}) => {
  const [isExpanded, setIsExpanded] = React.useState(expand);

  return (
    <>
      <TableRow {...otherProps}>
        <TableCell>
          <IconButton onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        {children}
      </TableRow>
      {isExpanded &&
        rows.map((row) => (
          <TableRow key={row.id + otherProps.key}>
            <TableCell align='right'>{'-'}</TableCell>
            <TableCell align='left'>{row.cohort_name}</TableCell>
            <TableCell align='right'>{''}</TableCell>
            <TableCell align='right'>{row.cohort_size}</TableCell>
            <TableCell align='right'>{''}</TableCell>
            <TableCell align='right'>{formatCohortDate(row.start_date)}</TableCell>
            <TableCell align='right'>
              <Button
                disabled={isDisabled(row.end_date)}
                variant='outlined'
                color='secondary'
                onClick={() => assignAction({ ...row, psi })}
              >
                Assign
              </Button>
            </TableCell>
          </TableRow>
        ))}
    </>
  );
};

export const PSICohortTable = ({ rows, assignAction, disabled }) => {
  const classes = useStyles();
  return (
    <div
      className='ui container'
      style={{
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? 'none' : 'initial',
      }}
    >
      <Paper className={classes.root}>
        <Table className={classes.table} aria-label='simple table'>
          <TableHead>
            <TableRow>
              <TableCell padding='checkbox' />
              <TableCell>Institute</TableCell>
              <TableCell align='right'>Health Authority</TableCell>
              <TableCell align='right'>Seats</TableCell>
              <TableCell align='right'>Postal Code</TableCell>
              <TableCell align='right'>Start Date</TableCell>
              <TableCell align='right'>{''}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row, index) => (
              <ExpandableTableRow
                expand={index === 0}
                key={row.id}
                rows={row.cohorts}
                assignAction={assignAction}
                psi={row}
              >
                <TableCell component='th' scope='row'>
                  {row.institute_name}
                </TableCell>
                <TableCell align='right'>{row.health_authority}</TableCell>
                <TableCell align='right'>{row.size}</TableCell>
                <TableCell align='right'>{row.postal_code}</TableCell>
                <TableCell align='right'>{''}</TableCell>
                <TableCell align='right'>{''}</TableCell>
              </ExpandableTableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </div>
  );
};
