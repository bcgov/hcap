import React, { Fragment, useState } from 'react';
import { styled } from '@mui/material/styles';
import { FixedSizeList } from 'react-window';
import MuiTable from '@mui/material/Table';
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

const PREFIX = 'Table';

const classes = {
  head: `${PREFIX}-head`,
  body: `${PREFIX}-body`,
  head2: `${PREFIX}-head2`,
  root: `${PREFIX}-root`,
  hover: `${PREFIX}-hover`,
  root2: `${PREFIX}-root2`,
};

// TODO jss-to-styled codemod: The Fragment root was replaced by div. Change the tag if needed.
const Root = styled('div')(({ theme }) => ({
  [`& .${classes.root2}`]: {
    display: 'flex',
    flexDirection: 'row',
    flexShrink: 0,
    marginLeft: theme.spacing(2.5),
  },
}));

const StyledTableCell = TableCell;

const StyledHeaderTableCell = TableCell;

const StyledTableRow = TableRow;

const TablePaginationActions = (props) => {
  const [anchorEl, setAnchorEl] = useState(null);

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
        size='large'
      >
        <FirstPageIcon />
      </IconButton>
      <IconButton
        onClick={handleBackButtonClick}
        disabled={page === 0}
        aria-label='previous page'
        size='large'
      >
        <KeyboardArrowLeft />
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label='next page'
        size='large'
      >
        <KeyboardArrowRight />
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label='last page'
        size='large'
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
  usePagination,
  isLoading,
  currentPage = 0,
  rowsPerPage,
  onChangePage,
  rowsCount,
}) => {
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  const handlePageChange = (_, newPage) => {
    onChangePage(currentPage, newPage);
  };
  return (
    <Root>
      <MuiTable stickyHeader>
        <TableHead>
          <TableRow>
            {columns.map((column, index) => (
              <StyledHeaderTableCell
                key={index}
                classes={{
                  head: classes.head2,
                }}
              >
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
                <StyledTableRow
                  key={i}
                  classes={{
                    root: classes.root,
                    hover: classes.hover,
                  }}
                >
                  {[...Array(columns.length)].map((_, i) => (
                    <StyledTableCell
                      key={i}
                      classes={{
                        head: classes.head,
                        body: classes.body,
                      }}
                    >
                      <Skeleton animation='wave' />
                    </StyledTableCell>
                  ))}
                </StyledTableRow>
              ))
            : rows.map((row, index) => (
                <StyledTableRow
                  hover
                  key={index}
                  classes={{
                    root: classes.root,
                    hover: classes.hover,
                  }}
                >
                  {columns.map((column) => (
                    <StyledTableCell
                      key={column.id}
                      classes={{
                        head: classes.head,
                        body: classes.body,
                      }}
                    >
                      {renderCell ? renderCell(column.id, row) : row[column.id] || ''}
                    </StyledTableCell>
                  ))}
                </StyledTableRow>
              ))}
        </TableBody>
      </MuiTable>
      {usePagination && (
        <TablePagination
          rowsPerPageOptions={[]}
          component='div'
          count={rowsCount || rows.length}
          rowsPerPage={rowsPerPage}
          page={currentPage}
          onPageChange={handlePageChange}
          ActionsComponent={isLoading ? () => null : TablePaginationActions}
        />
      )}
    </Root>
  );
};
