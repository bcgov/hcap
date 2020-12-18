import React, { Fragment, useEffect, useState } from 'react';
import IconButton from '@material-ui/core/IconButton';
import PropTypes from 'prop-types';
import MuiTable from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import TablePagination from '@material-ui/core/TablePagination';
import Skeleton from '@material-ui/lab/Skeleton';
import { withStyles, makeStyles } from '@material-ui/core/styles';

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

const StyledHeaderTableCell = withStyles((theme) => ({
  head: {
    ...theme.typography.body1,
    backgroundColor: theme.palette.common.white,
    borderBottom: `2px solid ${theme.palette.secondary.main}`,
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
    '&:nth-of-type(even)': {
      backgroundColor: '#FFFFFF',
    },
  },
  hover: {
    '&:hover': {
      backgroundColor: '#F0F7FF !important',
    },
  },
}))(TableRow);

const useStyles1 = makeStyles((theme) => ({
  root: {
    width: 1000,
    marginLeft: theme.spacing(2.5),
    flexShrink: 0,
  },
}));

function TablePaginationActions(props) {
  const classes = useStyles1();
  const { count, page, rowsPerPage, onChangePage } = props;

  const handleFirstPageButtonClick = (event) => {
    onChangePage(event, 0);
  };

  const handleBackButtonClick = (event) => {
    onChangePage(event, page - 1);
  };

  const handleIntButtonClick = (event) => {
    onChangePage(event, parseInt(event.target.textContent) - 1);
  };

  const handleNextButtonClick = (event) => {
    onChangePage(event, page + 1);
  };

  const handleLastPageButtonClick = (event) => {
    onChangePage(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));
  };

  function pageButtons(maxPage) {
    if (maxPage < 0) maxPage = 1;
    let ints = [...Array(maxPage+1).keys()].map(num => ++num);
    let buttons = ints.map(num => {
      return <IconButton 
      onClick={handleIntButtonClick} 
      key={"pageButton"+num} 
      aria-label='next page'>{num}</IconButton>;
    });

    return (
      <>
      {buttons}
      </>
    );
  };

  return (
    <div className={classes.root}>
    <IconButton
    onClick={handleFirstPageButtonClick}
    disabled={page === 0}
    aria-label="first page"
    >
    &#124;&#60;
    </IconButton>
    <IconButton onClick={handleBackButtonClick} disabled={page === 0} aria-label="previous page">
    &#60;
    </IconButton>
    {pageButtons(Math.ceil(count / rowsPerPage) - 1)}
    <IconButton
    onClick={handleNextButtonClick}
    disabled={page >= Math.ceil(count / rowsPerPage) - 1}
    aria-label="next page"
    >
    &#62;
    </IconButton>
    <IconButton
    onClick={handleLastPageButtonClick}
    disabled={page >= Math.ceil(count / rowsPerPage) - 1}
    aria-label="last page"
    >
    &#62;&#124;
    </IconButton>
    </div> 
  );
}

TablePaginationActions.propTypes = {
  count: PropTypes.number.isRequired,
  onChangePage: PropTypes.func.isRequired,
  page: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
};


export const Table = ({ order, orderBy, renderCell, onRequestSort, columns, rows, isLoading, rowsPerPage = 10, filterUpdated, setFilterUpdated }) => {

  const [pageRows, setPageRows] = useState([]);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const resetIfNeeded = () => {
      if (filterUpdated) {
        setFilterUpdated(false);
        setPage(0);
      }
    }
    const offset = page * rowsPerPage;
    const paginatedRows = rows.slice(offset, offset + rowsPerPage);
    setPageRows(paginatedRows);
    resetIfNeeded();

  }, [rows, page, rowsPerPage, renderCell, filterUpdated, setFilterUpdated ]);

  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  const onChangePage = (_, page) => {
    setPage(page);
  };

  return (
    <Fragment>
      <MuiTable
        stickyHeader>
        <TableHead>
          <TableRow>
            {columns.map((column, index) => (
              <StyledHeaderTableCell key={index}>
                {column.name && <TableSortLabel // Disable sorting if column has no header
                  active={orderBy === column.id}
                  direction={orderBy === column.id ? order : 'asc'}
                  onClick={createSortHandler(column.id)}>
                  {column.name}
                </TableSortLabel>}
              </StyledHeaderTableCell>
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
          )) : pageRows.map((row, index) => (
            <StyledTableRow hover key={index}>
              {columns.map((column) => (
                <StyledTableCell key={column.id}>
                  {
                    renderCell ?
                      renderCell(column.id, row[column.id])
                      :
                      row[column.id] || ''
                  }
                </StyledTableCell>
              ))}
            </StyledTableRow>
          ))}
        </TableBody>
      </MuiTable>
      <TablePagination
    ActionsComponent={TablePaginationActions}
        rowsPerPageOptions={[]}
        component="div"
        count={rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onChangePage={onChangePage}
      />
    </Fragment>
  );
};
