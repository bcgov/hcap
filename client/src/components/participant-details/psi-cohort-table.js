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

const useStyles = makeStyles({
  root: {
    width: '100%',
    overflowX: 'auto',
  },
  table: {
    minWidth: 650,
  },
});

function createData(institute_name, health_authority, cohorts, postal_code) {
  return { institute_name, health_authority, cohorts, postal_code };
}

const rows = [
  createData('UVic', 'Vancouver Island', 5, 'V8V 1M6'),
  createData('UBc', 'Vancouver Coastal', 5, 'V8V 1M6'),
];

const ExpandableTableRow = ({ expand = false, children, expandComponent, ...otherProps }) => {
  const [isExpanded, setIsExpanded] = React.useState(expand);

  return (
    <>
      <TableRow {...otherProps}>
        <TableCell padding='checkbox'>
          <IconButton onClick={() => setIsExpanded(!isExpanded)}>
            {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        {children}
      </TableRow>
      {isExpanded && (
        <TableRow>
          <TableCell padding='checkbox' />
          {expandComponent}
        </TableRow>
      )}
    </>
  );
};

export const PSICohortTable = () => {
  const classes = useStyles();

  return (
    <Paper className={classes.root}>
      <Table className={classes.table} aria-label='simple table'>
        <TableHead>
          <TableRow>
            <TableCell padding='checkbox' />
            <TableCell>Institute</TableCell>
            <TableCell align='right'>Health Authority</TableCell>
            <TableCell align='right'>Cohorts</TableCell>
            <TableCell align='right'>Postal Codes</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <ExpandableTableRow
              expand={index === 0}
              key={row.institute_name}
              expandComponent={
                <TableCell colSpan='5'>
                  {
                    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse malesuada lacus ex, sit amet blandit leo lobortis eget.'
                  }
                </TableCell>
              }
            >
              <TableCell component='th' scope='row'>
                {row.institute_name}
              </TableCell>
              <TableCell align='right'>{row.health_authority}</TableCell>
              <TableCell align='right'>{row.cohorts}</TableCell>
              <TableCell align='right'>{row.postal_code}</TableCell>
            </ExpandableTableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
};
