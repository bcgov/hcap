import React, { Fragment, useState, useEffect } from 'react';
import { FixedSizeList } from 'react-window';
import { styled } from '@mui/material/styles';

import Box from '@mui/material/Box';
import MuiTable from '@mui/material/Table';
import Checkbox from '@mui/material/Checkbox';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { List, ListItem, ListItemText, Menu, MenuItem } from '@mui/material';
import TableSortLabel from '@mui/material/TableSortLabel';
import TablePagination from '@mui/material/TablePagination';
import Skeleton from '@mui/material/Skeleton';

import IconButton from '@mui/material/IconButton';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import LastPageIcon from '@mui/icons-material/LastPage';

import { Button } from './';
import { Program } from '../../constants';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  '&.MuiTableCell-head': {
    ...theme.typography.body1,
    backgroundColor: theme.palette.common.white,
    color: '#333333',
  },
  '&.MuiTableCell-body': {
    ...theme.typography.body1,
  },
}));

const StyledHeaderTableCell = styled(TableCell)(({ theme }) => ({
  '&.MuiTableCell-head': {
    ...theme.typography.body1,
    backgroundColor: theme.palette.common.white,
    borderBottom: `2px solid ${theme.palette.secondary.main}`,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(1)': {
    borderTop: `2px solid ${theme.palette.secondary.main}`,
  },
  '&:nth-of-type(odd)': {
    backgroundColor: '#FAFAFA',
  },
  '&:nth-of-type(even)': {
    backgroundColor: '#FFFFFF',
  },
  '&.MuiTableRow-hover:hover': {
    backgroundColor: '#F0F7FF !important',
  },
}));

const PaginationRoot = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'row',
  flexShrink: 0,
  marginLeft: theme.spacing(2.5),
}));

const ActionButton = styled(Button)({
  maxWidth: '150px',
});

const TablePaginationActions = (props) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const { count, page, rowsPerPage, onPageChange } = props;

  const handleFirstPageButtonClick = (event) => {
    onPageChange(event, 0);
  };

  const handleBackButtonClick = (event) => {
    onPageChange(event, page - 1);
  };

  const handleNextButtonClick = (event) => {
    onPageChange(event, page + 1);
  };

  const handleLastPageButtonClick = (event) => {
    onPageChange(event, Math.max(0, Math.floor(count / rowsPerPage)));
  };

  const handleClickListItem = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuItemClick = (event, index) => {
    onPageChange(event, index);
    setAnchorEl(null);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const menuMaxHeight = 400;
  const menuItemCount = Math.ceil(count / rowsPerPage);
  const menuItemSize = 45;

  return (
    <PaginationRoot>
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
        <li style={{ listStyle: 'none', padding: 0 }}>
          <button
            type='button'
            style={{
              width: '100%',
              background: 'none',
              border: 'none',
              textAlign: 'left',
              padding: '8px 16px',
              cursor: 'pointer',
              font: 'inherit',
            }}
            aria-haspopup='true'
            aria-controls='page-select'
            aria-label='go to page'
            onClick={handleClickListItem}
          >
            Skip to page...
          </button>
        </li>
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
    </PaginationRoot>
  );
};

const MultiSelectAction = (props) => {
  const { multiSelectAction, selected } = props;

  return (
    <Box pb={2}>
      <ActionButton
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
        prevColumns.filter(
          (i) =>
            i.id !== 'experienceWithMentalHealthOrSubstanceUse' &&
            i.id !== 'interestedWorkingPeerSupportRole',
        ),
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
          onPageChange={handlePageChange}
          onRowsPerPageChange={handlePageSizeChange}
          ActionsComponent={isLoading ? () => null : TablePaginationActions}
        />
      )}
    </Fragment>
  );
};
