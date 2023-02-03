import React, { useCallback, useEffect, useState } from 'react';

import { Grid } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { Table, Button } from '../../components/generic';

import dayjs from 'dayjs';

import { sortObjects } from '../../utils';

export const useTableStyles = makeStyles((theme) => ({
  rootItem: {
    paddingLeft: theme.spacing(2),
    paddingRight: theme.spacing(2),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
  },
  tableItem: {
    paddingTop: theme.spacing(4),
    paddingRight: theme.spacing(2),
    paddingBottom: theme.spacing(4),
    paddingLeft: theme.spacing(2),
  },
  filterLabel: {
    color: theme.palette.gray.dark,
    fontWeight: 700,
  },
  actionMenuPaper: {
    minWidth: '220px',
  },
  menuItem: {
    padding: '.75rem',
    fontSize: '17px',
  },
}));

/**
 * @typedef {Object} modalComponentProps
 * @property {() => any} onSubmit              Callback form submission.
 * @property {function} onClose                Callback for modal close.
 * @property {boolean} open                    Whether to display the modal.
 * @property {Object} content                  Data to pass to the dialog, such as initial form values.
 *
 *
 * @typedef {Object} buttonConfig
 * @property {string} label                    Button inner text.
 * @property {(row: object) => any?} callback  Callback function, passed the row that the click happened on.
 * @property {modalComponent} modal            Modal component to bind to the button.
 *
 *
 * @typedef {Object} column
 * @property {string} id                       ID string for the column, e.g. `'start_date'`.
 *                                             Must match a property name in the target data.
 * @property {string} name                     Label for the column, e.g. `'Start Date'`
 * @property {undefined|'date'|'button'} type  Type of column, used for formatting.
 *                                             * `date` will format the column as a date, using a UTC ISO timestamp.
 *                                             * `button` will render a button (see the `button` property).
 *                                             * `modal` will open a model (see the `button.modal` property).
 * @property {buttonConfig?} button            Configuration for buttons, if `type` is `'button'`.
 *
 * @typedef {Object} modalState                State of a specific modal. These values get passed to an individual modal component.
 * @property {boolean} open                    Whether to display the modal.
 * @property {Object} content                  Any object containing data the modal can work with, such as form presets.
 *                                             Modal-specific, see documentation for specific modal components in use.
 *
 * @typedef {(columns: column[] ) => Promise<Object[]> } fetchFunction
 * @typedef {(props: modalComponentProps) => JSX.Element?} modalComponent
 */

/**
 * Data table component, renders arbitrary columns using a provided data fetching callback.
 * @param {object}   props
 * @param {column[]} props.columns             Array of column configuration objects.
 *                                             Defines the table's structure and behaviour.
 * @param {fetchFunction} props.fetchData      Async function to fetch data for this table.
 *                                             Must return an array of objects, with keys matching column IDs.
 * @returns {JSX.Element}
 */
export const DataTable = ({ columns, fetchData, data }) => {
  const classes = useTableStyles();

  // Sorting settings
  const [order, setOrder] = useState('asc');
  const [orderBy, setOrderBy] = useState('name');

  // Whether or not data is currently loading
  const [isLoadingData, setLoadingData] = useState(false);
  // Whether or not there is data loaded to render
  const [hasData, setHasData] = useState(true);

  const [rows, setRows] = useState([]);

  const handleRequestSort = (_, property) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const loadData = useCallback(async () => {
    setLoadingData(true);
    const rowsData = await fetchData(columns);

    setRows(rowsData);
    // NOTE: it might be a good idea to add error handling here outside of simply an empty result list.
    setHasData(rowsData.length > 0);
    setLoadingData(false);
  }, [setRows, fetchData, columns]);

  const sort = (array) => sortObjects(array, orderBy, order);

  useEffect(() => {
    if (data) {
      setRows(data);
    } else {
      loadData();
    }
  }, [data, loadData]);

  const columnTypes = Object.fromEntries(columns.map((column) => [column.id, column.type]));
  const modalList = columns
    .filter((column) => column.button && column.button.modal)
    .map((column) => ({ id: column.id, modal: column.button.modal }));

  /**
   * State management for any modals assigned to this table.
   * @type [{[id: string]: modalState}, function]
   */
  const [modalsState, setModalsState] = useState(
    Object.fromEntries(
      columns
        .filter((column) => column.button && column.button.modal)
        .map((column) => [column.id, { open: false, content: {} }])
    )
  );

  /**
   * @param {string} id      ID of the row to to open the modal for.
   * @param {object} content Content to pass to the opened modal.
   */
  const openModal = (id, content) => {
    const newState = { ...modalsState };
    newState[id].open = true;
    newState[id].content = content;
    setModalsState(newState);
  };

  /**
   * @param {string} id      ID of the row to to close the modal for.
   */
  const closeModal = (id) => {
    const newState = { ...modalsState };
    newState[id].open = false;
    setModalsState(newState);
  };

  const modalSubmit = (id) => {
    closeModal(id);
    loadData();
  };

  const buttonConfigs = Object.fromEntries(
    columns.map((column) => {
      if (column.button && !column.button.callback && column.button.modal) {
        column.button.callback = (row) => openModal(column.id, row);
      }
      return [column.id, column.button];
    })
  );

  return (
    <>
      {modalList.map((modal) => (
        <modal.modal
          key={modal.id}
          open={modalsState[modal.id].open}
          onSubmit={() => modalSubmit(modal.id)}
          onClose={() => closeModal(modal.id)}
          content={modalsState[modal.id].content}
        />
      ))}

      <Grid
        container
        alignContent='flex-start'
        justify='flex-start'
        alignItems='center'
        direction='row'
      >
        {hasData && (
          <Grid className={classes.tableItem} item xs={12}>
            <Table
              columns={columns}
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
              rows={sort(rows)}
              isLoading={isLoadingData}
              renderCell={(columnId, row) => {
                if (columnTypes[columnId] === 'date')
                  return dayjs.utc(row[columnId]).format('MMM DD, YYYY');
                if (columnTypes[columnId] === 'button')
                  return (
                    <Button
                      variant='outlined'
                      size='small'
                      text={buttonConfigs[columnId].label}
                      // Might be worth coalescing this, or eventually enforcing with TS,
                      // but for now throwing a runtime error for missing callback works.
                      onClick={() => buttonConfigs[columnId].callback(row)}
                    />
                  );
                return row[columnId];
              }}
            />
          </Grid>
        )}
      </Grid>
    </>
  );
};
