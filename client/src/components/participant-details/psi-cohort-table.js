import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Button,
  styled,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { formatCohortDate } from '../../utils';

const TableContainer = styled(Paper)(({ theme }) => ({
  width: '100%',
  overflowX: 'auto',
}));

const StyledTable = styled(Table)(({ theme }) => ({
  minWidth: 650,
}));

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
          <TableRow key={row.id + 9999}>
            <TableCell align='right'>{'-'}</TableCell>
            <TableCell align='left'>{row.cohort_name}</TableCell>
            <TableCell align='right'>{''}</TableCell>
            <TableCell align='right'>{row.availableSize}</TableCell>
            <TableCell align='right'>{''}</TableCell>
            <TableCell align='right'>{formatCohortDate(row.start_date)}</TableCell>
            <TableCell align='right'>
              <Button
                disabled={isDisabled(row.end_date) || row.availableSize <= 0}
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
  return (
    <div
      className='ui container'
      style={{
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? 'none' : 'initial',
      }}
    >
      <TableContainer>
        <StyledTable aria-label='simple table'>
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
        </StyledTable>
      </TableContainer>
    </div>
  );
};
