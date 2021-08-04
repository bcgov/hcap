import React, { Fragment, useState } from 'react';
import { FixedSizeList } from 'react-window';
import MuiTable from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import { List, ListItem, ListItemText, Menu, MenuItem } from '@material-ui/core';
import TableSortLabel from '@material-ui/core/TableSortLabel';
import TablePagination from '@material-ui/core/TablePagination';
import Skeleton from '@material-ui/lab/Skeleton';
import { withStyles, makeStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import FirstPageIcon from '@material-ui/icons/FirstPage';
import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import LastPageIcon from '@material-ui/icons/LastPage';

const StyledTableCell = withStyles((theme) => ({
  head: {
    ...theme.typography.body1,
    backgroundColor: theme.palette.common.white,
    color: '#333333',
  },
  body: {
    ...theme.typography.body1,
  },
}))(TableCell);

const StyledHeaderTableCell = withStyles((theme) => ({
  head: {
    ...theme.typography.body1,
    backgroundColor: theme.palette.common.white,
    borderBottom: `2px solid ${theme.palette.secondary.main}`,
  },
}))(TableCell);

const StyledTableRow = withStyles((theme) => ({
  root: {
    '&:nth-child(1)': {
      borderTop: `2px solid ${theme.palette.secondary.main}`,
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

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    flexDirection: 'row',
    flexShrink: 0,
    marginLeft: theme.spacing(2.5),
  },
}));

const TablePaginationActions = (props) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const classes = useStyles();
  const { count, page, rowsPerPage, onChangePage } = props;


  const handleFirstPageButtonClick = (event) => {
    onChangePage(event, 0);
  };

  const handleBackButtonClick = (event) => {
    onChangePage(event, page - 1);
  };

  const handleNextButtonClick = (event) => {
    onChangePage(event, page + 1);
  };

  const handleLastPageButtonClick = (event) => {
    onChangePage(event, Math.max(0, Math.floor(count / rowsPerPage)));
  };

  const handleClickListItem = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuItemClick = (event, index) => {
    onChangePage(event, index);
    setAnchorEl(null);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const menuMaxHeight = 400;
  const menuItemCount = Math.ceil(count / rowsPerPage);
  const menuItemSize = 45;

  return (
    <div className={classes.root}>
      <IconButton
        onClick={handleFirstPageButtonClick}
        disabled={page === 0}
        aria-label='first page'
      >
        <FirstPageIcon />
      </IconButton>
      <IconButton onClick={handleBackButtonClick} disabled={page === 0} aria-label='previous page'>
        <KeyboardArrowLeft />
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label='next page'
      >
        <KeyboardArrowRight />
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label='last page'
      >
        <LastPageIcon />
      </IconButton>
      <List component='nav' aria-label='Page Selector'>
        <ListItem
          button
          aria-haspopup='true'
          aria-controls='page-select'
          aria-label='go to page'
          onClick={handleClickListItem}
        >
          <ListItemText primary='Skip to page...' />
        </ListItem>
      </List>
      <Menu
        id='page-select'
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <FixedSizeList
          height={Math.min(menuItemCount * menuItemSize, menuMaxHeight)}
          width={120}
          itemSize={menuItemSize}
          itemCount={menuItemCount}
        >
          {({ index, style }) => (
            <MenuItem
              key={index}
              style={style}
              selected={index === page}
              onClick={(event) => handleMenuItemClick(event, index)}
            >
              Page {index + 1}
            </MenuItem>
          )}
        </FixedSizeList>
      </Menu>
    </div>
  );
};

export const Table = ({
  order,
  orderBy,
  renderCell,
  onRequestSort,
  columns,
  rows,
  isLoading,
  currentPage = 0,
  rowsPerPage = 10, 
  onChangePage,
  rowsCount,
}) => {
  console.log(currentPage,rowsPerPage,)
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  const handlePageChange = (_, newPage) => {
    onChangePage(currentPage, newPage);
  };
  return (
    <Fragment>
      <MuiTable stickyHeader>
        <TableHead>
          <TableRow>
            {columns.map((column, index) => (
              <StyledHeaderTableCell key={index}>
                {column.name && (
                  <TableSortLabel // Disable sorting if column has no header
                    disabled={isLoading || column.sortable === false}
                    active={orderBy === column.id}
                    direction={orderBy === column.id ? order : 'asc'}
                    onClick={createSortHandler(column.id)}
                  >
                    {column.name}
                  </TableSortLabel>
                )}
              </StyledHeaderTableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {isLoading
            ? [...Array(8)].map((_, i) => (
                <StyledTableRow key={i}>
                  {[...Array(columns.length)].map((_, i) => (
                    <StyledTableCell key={i}>
                      <Skeleton animation='wave' />
                    </StyledTableCell>
                  ))}
                </StyledTableRow>
              ))
            : rows.map((row, index) => (
                <StyledTableRow hover key={index}>
                  {columns.map((column) => (
                    <StyledTableCell key={column.id}>
                      {renderCell ? renderCell(column.id, row) : row[column.id] || ''}
                    </StyledTableCell>
                  ))}
                </StyledTableRow>
              ))}
        </TableBody>
      </MuiTable>
      <TablePagination
        rowsPerPageOptions={[]}
        component='div'
        count={rowsCount || rows.length}
        rowsPerPage={rowsPerPage}
        page={currentPage}
        onChangePage={handlePageChange}
        ActionsComponent={isLoading ? () => null : TablePaginationActions}
      />
    </Fragment>
  );
};
