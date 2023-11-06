import React, { Fragment, useState, useEffect } from 'react';
import { FixedSizeList } from 'react-window';

import Box from '@material-ui/core/Box';
import MuiTable from '@material-ui/core/Table';
import Checkbox from '@material-ui/core/Checkbox';
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

import { Button } from './';
import { Program } from '../../constants';

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
  actionButton: {
    maxWidth: '150px',
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

const MultiSelectAction = (props) => {
  const classes = useStyles();
  const { multiSelectAction, selected } = props;

  return (
    <Box pb={2}>
      <Button
        className={classes.actionButton}
        size='small'
        variant='outlined'
        text='Bulk Engage'
        disabled={selected.length < 1}
        onClick={multiSelectAction}
      />
    </Box>
  );
};

export const Table = ({
  order,
  orderBy,
  renderCell,
  onRequestSort,
  columns,
  rows,
  usePagination,
  isLoading,
  currentPage = 0,
  rowsPerPage,
  rowsPerPageOptions = [],
  onChangePage,
  onChangePageSize,
  totalRowsCount,
  isMultiSelect = false,
  selectedRows = [],
  updateSelectedRows,
  multiSelectAction,
  filter,
}) => {
  const [columnState, setColumnState] = useState(columns);
  // living checkbox should be hidden if use filters program by HCA
  // remove checked box if user selects living experience filter and switches to HCA
  useEffect(() => {
    if (filter?.programFilter?.value === Program.HCA) {
      setColumnState((prevColumns) =>
        prevColumns.filter((i) => i.id !== 'experienceWithMentalHealthOrSubstanceUse')
      );
    } else {
      setColumnState(columns);
    }
  }, [filter, columns]);

  const rowsOnPage = rows.length;
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  const handlePageChange = (_, newPage) => {
    updateSelectedRows([]);
    onChangePage(currentPage, newPage);
  };

  const handlePageSizeChange = (event) => {
    updateSelectedRows([]);
    onChangePageSize(event.target.value);
  };

  const handleSelectAllRows = (event) => {
    if (event.target.checked) {
      updateSelectedRows(rows);
      return;
    }
    updateSelectedRows([]);
  };

  const handleSelectRow = (_event, newRow) => {
    const rowInd = selectedRows.findIndex((row) => row?.id === newRow?.id);
    let arr = [];

    if (rowInd === -1) {
      // row is not selected -> check
      arr = arr.concat(selectedRows, newRow);
    } else {
      // row is selected -> uncheck
      if (rowInd === 0) {
        arr = arr.concat(selectedRows.slice(1));
      } else if (rowInd === selectedRows.length - 1) {
        arr = arr.concat(selectedRows.slice(0, -1));
      } else if (rowInd > 0) {
        arr = arr.concat(selectedRows.slice(0, rowInd), selectedRows.slice(rowInd + 1));
      }
    }
    updateSelectedRows(arr);
  };

  return (
    <Fragment>
      {isMultiSelect && multiSelectAction && (
        <MultiSelectAction selected={selectedRows} multiSelectAction={multiSelectAction} />
      )}

      <MuiTable stickyHeader>
        <TableHead>
          <TableRow>
            {isMultiSelect && (
              <StyledHeaderTableCell padding='checkbox'>
                <Checkbox
                  color='primary'
                  disabled={isLoading || rowsOnPage === 0}
                  indeterminate={selectedRows.length > 0 && selectedRows.length < rowsOnPage}
                  checked={rowsOnPage > 0 && selectedRows.length === rowsOnPage}
                  onChange={handleSelectAllRows}
                />
              </StyledHeaderTableCell>
            )}
            {columnState.map((column, index) => (
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
                  {isMultiSelect && (
                    <StyledTableCell padding='checkbox'>
                      <Checkbox color='primary' disabled />
                    </StyledTableCell>
                  )}
                  {[...Array(columnState.length)].map((_, i) => (
                    <StyledTableCell key={i}>
                      <Skeleton animation='wave' />
                    </StyledTableCell>
                  ))}
                </StyledTableRow>
              ))
            : rows.map((row, index) => {
                const isRowSelected =
                  selectedRows.findIndex((currentRow) => currentRow?.id === row?.id) !== -1;

                return (
                  <StyledTableRow key={index} hover>
                    {isMultiSelect && (
                      <StyledHeaderTableCell padding='checkbox'>
                        <Checkbox
                          color='primary'
                          checked={isRowSelected}
                          onClick={(event) => handleSelectRow(event, row)}
                        />
                      </StyledHeaderTableCell>
                    )}
                    {columnState.map((column) => (
                      <StyledTableCell key={column.id}>
                        {renderCell ? renderCell(column.id, row) : row[column.id] || ''}
                      </StyledTableCell>
                    ))}
                  </StyledTableRow>
                );
              })}
        </TableBody>
      </MuiTable>
      {usePagination && (
        <TablePagination
          rowsPerPageOptions={rowsPerPageOptions}
          component='div'
          count={totalRowsCount || rowsOnPage}
          rowsPerPage={rowsPerPage}
          page={currentPage}
          SelectProps={{ 'test-id': 'pageSizeSelect' }}
          onChangePage={handlePageChange}
          onChangeRowsPerPage={handlePageSizeChange}
          ActionsComponent={isLoading ? () => null : TablePaginationActions}
        />
      )}
    </Fragment>
  );
};
