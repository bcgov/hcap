import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import Grid from '@material-ui/core/Grid';
import { Box, Menu, MenuItem, Link } from '@material-ui/core';
import store from 'store';
import {
  ToastStatus,
  InterviewingFormSchema,
  RejectedFormSchema,
  regionLabelsMap,
  API_URL,
  pageSize,
  makeToasts,
  Routes,
} from '../../constants';
import {
  Table,
  CheckPermissions,
  Button,
  Dialog,
  CustomTab,
  CustomTabs,
} from '../../components/generic';
import {
  ProspectingForm,
  InterviewingForm,
  RejectedForm,
  HireForm,
  NewParticipantForm,
  EditParticipantForm,
  ArchiveHiredParticipantForm,
} from '../../components/modal-forms';
import { useToast } from '../../hooks';
import { getDialogTitle, prettifyStatus, keyedString } from '../../utils';
import moment from 'moment';
import { AuthContext, ParticipantsContext } from '../../providers';
import { ParticipantTableFilters } from './ParticipantTableFilters';

const filterData = (data, columns) => {
  const emailAddressMask = '***@***.***';
  const phoneNumberMask = '(***) ***-****';

  const mapItemToColumns = (item, columns) => {
    const row = {};

    columns.forEach((column) => {
      row[column.id] = item[column.id];
    });

    return row;
  };

  const filteredRows = [];

  data?.forEach((dataItem) => {
    const item = { ...dataItem };
    if (!item.emailAddress) {
      item.emailAddress = emailAddressMask;
    }

    if (!item.phoneNumber) {
      item.phoneNumber = phoneNumberMask;
    }

    const row = mapItemToColumns(item, columns);

    row.engage = item;
    row.siteName = item?.statusInfos?.[0].data?.siteName;

    if (item.statusInfos && item.statusInfos.length > 0) {
      // Handling already_hired and withdrawn status
      const previousStatus = item.statusInfos.find((statusInfo) => statusInfo.data?.previous);
      if (item.statusInfos.find((statusInfo) => statusInfo.status === 'withdrawn')) {
        row.status = [previousStatus?.data.previous || item.statusInfos[0].status, 'withdrawn'];
      } else if (item.statusInfos.find((statusInfo) => statusInfo.status === 'already_hired')) {
        row.status = [previousStatus?.data.previous || item.statusInfos[0].status, 'already_hired'];
      } else {
        row.status = [item.statusInfos[0].status];
      }
    } else if (item.progressStats) {
      row.status = ['open', ...Object.keys(item.progressStats).filter((key) => key === 'archived')];
    } else {
      row.status = ['open'];
    }

    row.engage.status = row.status[0];

    filteredRows.push(row);
  });
  return filteredRows;
};

const ParticipantTable = () => {
  const history = useHistory();
  const { openToast } = useToast();
  const [isLoadingData, setLoadingData] = useState(false);
  const [rows, setRows] = useState([]);
  const [actionMenuParticipant, setActionMenuParticipant] = useState(null);
  const [anchorElement, setAnchorElement] = useState(null);
  const [activeModalForm, setActiveModalForm] = useState(null);
  const [locations, setLocations] = useState([]);
  const {
    state: {
      columns,
      tabs,
      selectedTab,
      selectedTabStatuses,
      pagination,
      filter,
      order,
      siteSelector,
    },
    dispatch: participantsDispatch,
  } = ParticipantsContext.useParticipantsContext();
  const { auth } = AuthContext.useAuth();
  const roles = useMemo(() => auth.user?.roles || [], [auth.user?.roles]);
  const sites = useMemo(() => auth.user?.sites || [], [auth.user?.sites]);

  const isMoH = roles.includes('ministry_of_health');
  const isSuperUser = roles.includes('superuser');
  const isAdmin = isMoH || isSuperUser;
  const isEmployer = roles.includes('health_authority') || roles.includes('employer');

  const fetchParticipantsFunction = async (
    offset,
    regionFilter,
    fsaFilter,
    lastNameFilter,
    emailFilter,
    sortField,
    sortDirection,
    siteSelector,
    statusFilters,
    isIndigenousFilter
  ) => {
    const queries = [
      sortField && `sortField=${sortField}`,
      offset && `offset=${offset}`,
      sortDirection && `sortDirection=${sortDirection}`,
      regionFilter && `regionFilter=${regionFilter}`,
      fsaFilter && `fsaFilter=${fsaFilter}`,
      lastNameFilter && `lastNameFilter=${lastNameFilter}`,
      siteSelector && `siteSelector=${siteSelector}`,
      emailFilter && `emailFilter=${emailFilter}`,
      isIndigenousFilter && `isIndigenousFilter=${isIndigenousFilter}`,
      ...(statusFilters && statusFilters.map((status) => `statusFilters[]=${status}`)),
    ]
      .filter((item) => item)
      .join('&');
    const response = await fetch(`${API_URL}/api/v1/participants?${queries}`, {
      headers: {
        Accept: 'application/json',
        'Content-type': 'application/json',
        Authorization: `Bearer ${store.get('TOKEN')}`,
      },
      method: 'GET',
    });

    if (response.ok) {
      return response.json();
    }
  };
  const fetchParticipants = useCallback(fetchParticipantsFunction, []);

  const handleEngage = async (participantId, status, additional = {}) => {
    const response = await fetch(`${API_URL}/api/v1/employer-actions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${store.get('TOKEN')}`,
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify({ participantId, status, data: additional }),
    });

    if (response.ok) {
      const { data: statusData } = await response.json();

      if (status === 'prospecting') {
        // Modal appears after submitting
        setActiveModalForm('prospecting');
      } else {
        const index = rows.findIndex((row) => row.id === participantId);
        const { firstName, lastName } = rows[index];
        const toasts = makeToasts(firstName, lastName);
        openToast(toasts[statusData?.status === 'already_hired' ? statusData.status : status]);
        setActionMenuParticipant(null);
        setActiveModalForm(null);
        forceReload();
      }
    } else {
      openToast({
        status: ToastStatus.Error,
        message: response.error || response.statusText || 'Server error',
      });
    }
  };
  const handleAcknowledge = async (id) => {
    const response = await fetch(`${API_URL}/api/v1/employer-actions/acknowledgment`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${store.get('TOKEN')}`,
        Accept: 'application/json',
        'Content-type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });
    if (response.ok) {
      openToast({
        status: ToastStatus.Success,
        message: 'Update successful',
      });
      setActionMenuParticipant(null);
      setActiveModalForm(null);
      forceReload();
    } else {
      openToast({
        status: ToastStatus.Error,
        message: 'An error occured',
      });
    }
  };

  const forceReload = async () => {
    if (!columns) return;
    if (!selectedTab) return;
    setLoadingData(true);
    const { data } = await fetchParticipants(
      pagination.page * pageSize,
      filter.locationFilter?.value || '',
      filter.fsaFilter?.value || '',
      filter.lastNameFilter?.value || '',
      filter.emailFilter?.value || '',
      order.field,
      order.direction,
      siteSelector,
      selectedTabStatuses,
      filter.isIndigenousFilter?.value
    );
    const newRows = filterData(data, columns);
    setRows(newRows);
    setLoadingData(false);
  };

  // Set available locations
  useEffect(() => {
    // Either returns all location roles or a role mapping with a Boolean filter removes all undefined values
    const regions = Object.values(regionLabelsMap).filter((value) => value !== 'None');
    setLocations(
      isMoH || isSuperUser ? regions : roles.map((loc) => regionLabelsMap[loc]).filter(Boolean)
    );
  }, [isMoH, isSuperUser, roles]);

  // Fetch Data
  useEffect(() => {
    const getParticipants = async () => {
      if (!columns) return;
      if (!selectedTab) return;
      setLoadingData(true);
      const { data, pagination: newPagination } = await fetchParticipants(
        pagination.page * pageSize,
        filter.locationFilter?.value || '',
        filter.fsaFilter?.value || '',
        filter.lastNameFilter?.value || '',
        filter.emailFilter?.value || '',
        order.field,
        order.direction,
        siteSelector,
        selectedTabStatuses,
        filter.isIndigenousFilter?.value
      );
      participantsDispatch({
        type: ParticipantsContext.types.UPDATE_PAGINATION,
        payload: newPagination,
      });
      const newRows = filterData(data, columns);
      setRows(newRows);
      setLoadingData(false);
    };

    getParticipants();
  }, [
    fetchParticipants,
    pagination.page,
    siteSelector,
    filter,
    order,
    roles,
    columns,
    selectedTab,
    selectedTabStatuses,
    participantsDispatch,
  ]);

  const onFormModalClose = () => {
    setActiveModalForm(null);
    setActionMenuParticipant(null);
  };

  const renderCell = (columnId, row) => {
    switch (columnId) {
      case 'lastName':
        if (isAdmin || (isEmployer && selectedTab === 'Hired Candidates')) {
          return (
            <Link
              component='button'
              variant='body2'
              onClick={() => {
                const { id } = row;
                const participantDetailsPath = keyedString(Routes.ParticipantDetails, {
                  id,
                  page: 'participant',
                });
                history.push(participantDetailsPath);
              }}
            >
              {row[columnId]}
            </Link>
          );
        }
        break;
      case 'callbackStatus':
        return row[columnId] ? 'Primed' : 'Available';
      case 'status':
        return prettifyStatus(row[columnId], row.id, selectedTab, handleEngage, handleAcknowledge);
      case 'distance':
        if (row[columnId] !== null && row[columnId] !== undefined) {
          return `${Math.round(row[columnId] / 1000) || '<1'} Km`;
        }
        return 'N/A';
      case 'engage':
        const engage =
          !row.status.includes('already_hired') &&
          !row.status.includes('withdrawn') &&
          !row.status.includes('archived');

        return (
          engage && (
            <Button
              onClick={(event) => {
                setActionMenuParticipant(row[columnId]);
                setAnchorElement(event.currentTarget);
              }}
              variant='outlined'
              size='small'
              text='Actions'
            />
          )
        );
      case 'edit':
        return (
          <Button
            onClick={async (event) => {
              // Get data from row.id
              const response = await fetch(`${API_URL}/api/v1/participant?id=${row.id}`, {
                headers: {
                  Accept: 'application/json',
                  'Content-type': 'application/json',
                  Authorization: `Bearer ${store.get('TOKEN')}`,
                },
                method: 'GET',
              });

              const participant = await response.json();
              if (participant[0].postalCode === undefined) {
                participant[0].postalCode = '';
              }
              setActionMenuParticipant(participant[0]);
              setActiveModalForm('edit-participant');
              setAnchorElement(event.currentTarget);
            }}
            variant='outlined'
            size='small'
            text='Edit'
          />
        );
      case 'userUpdatedAt':
        return moment(row.userUpdatedAt).fromNow();
      case 'archive':
        return (
          <>
            {!row.status.includes('withdrawn') && (
              <Button
                onClick={async (event) => {
                  setAnchorElement(event.currentTarget);
                  // Get data from row.id
                  const response = await fetch(`${API_URL}/api/v1/participant?id=${row.id}`, {
                    headers: {
                      Accept: 'application/json',
                      'Content-type': 'application/json',
                      Authorization: `Bearer ${store.get('TOKEN')}`,
                    },
                    method: 'GET',
                  });
                  const participant = await response.json();
                  setActionMenuParticipant(participant[0]);
                  setActiveModalForm('archive');
                }}
                variant='outlined'
                size='small'
                text='Archive'
              />
            )}
          </>
        );
      default:
        return row[columnId];
    }
    return row[columnId];
  };

  if (!columns) return null;
  return (
    <>
      <Dialog
        title={getDialogTitle(activeModalForm)}
        open={activeModalForm != null}
        onClose={onFormModalClose}
      >
        {activeModalForm === 'prospecting' && (
          <ProspectingForm
            name={`${actionMenuParticipant.firstName} ${actionMenuParticipant.lastName}`}
            onClose={() => {
              forceReload();
              onFormModalClose();
            }}
            onSubmit={async () => {
              onFormModalClose();

              participantsDispatch({
                type: ParticipantsContext.types.SELECT_TAB,
                payload: 'My Candidates',
              });
            }}
          />
        )}

        {activeModalForm === 'interviewing' && (
          <InterviewingForm
            initialValues={{ contactedDate: '' }}
            validationSchema={InterviewingFormSchema}
            onSubmit={(values) => {
              handleEngage(actionMenuParticipant.id, 'interviewing', {
                contacted_at: values.contactedDate,
              });
            }}
            onClose={onFormModalClose}
          />
        )}

        {activeModalForm === 'rejected' && (
          <RejectedForm
            initialValues={{ contactedDate: '' }}
            validationSchema={RejectedFormSchema}
            onSubmit={(values) => {
              handleEngage(actionMenuParticipant.id, 'rejected', {
                final_status: values.finalStatus,
              });
            }}
            onClose={onFormModalClose}
          />
        )}

        {activeModalForm === 'hired' && (
          <HireForm
            sites={sites}
            onSubmit={(values) => {
              handleEngage(actionMenuParticipant.id, 'hired', {
                nonHcapOpportunity: values.nonHcapOpportunity,
                positionTitle: values.positionTitle,
                positionType: values.positionType,
                hiredDate: values.hiredDate,
                startDate: values.startDate,
                site: values.site,
              });
            }}
            onClose={onFormModalClose}
          />
        )}
        {activeModalForm === 'edit-participant' && (
          <EditParticipantForm
            initialValues={actionMenuParticipant}
            onClose={onFormModalClose}
            submissionCallback={forceReload}
          />
        )}
        {activeModalForm === 'new-participant' && (
          <NewParticipantForm
            sites={sites}
            onClose={onFormModalClose}
            submissionCallback={forceReload}
          />
        )}
        {activeModalForm === 'archive' && (
          <ArchiveHiredParticipantForm
            onSubmit={(values) => {
              handleEngage(actionMenuParticipant.id, 'archived', values);
            }}
            onClose={onFormModalClose}
          />
        )}
      </Dialog>
      <CheckPermissions
        permittedRoles={['employer', 'health_authority', 'ministry_of_health']}
        renderErrorMessage={true}
      >
        <Grid
          container
          alignContent='center'
          justify='center'
          alignItems='center'
          direction='column'
        >
          <Grid
            container
            alignContent='center'
            justify='flex-start'
            alignItems='center'
            direction='row'
          >
            <ParticipantTableFilters loading={isLoadingData} locations={locations} />

            {selectedTab === 'Hired Candidates' && (
              <Grid container item xs={2} style={{ marginLeft: 'auto', marginRight: 20 }}>
                <Button
                  onClick={() => setActiveModalForm('new-participant')}
                  text='Add Non-Portal Hire'
                  size='medium'
                />
              </Grid>
            )}
          </Grid>

          <Box pt={2} pb={2} pl={2} pr={2} width='100%'>
            <CustomTabs
              value={selectedTab || false}
              onChange={async (_, property) => {
                participantsDispatch({
                  type: ParticipantsContext.types.SELECT_TAB,
                  payload: property,
                });
              }}
            >
              {
                tabs.map((key) => (
                  <CustomTab key={key} label={key} value={key} disabled={isLoadingData} />
                )) // Tab component with tab name as value
              }
            </CustomTabs>
            <Table
              usePagination={true}
              columns={columns}
              order={order.direction}
              orderBy={order.field}
              rowsCount={pagination.total}
              onChangePage={(_, newPage) => {
                participantsDispatch({
                  type: ParticipantsContext.types.UPDATE_PAGINATION,
                  payload: { page: newPage },
                });
              }}
              rowsPerPage={pageSize}
              currentPage={pagination.page}
              renderCell={renderCell}
              onRequestSort={(event, property) => {
                participantsDispatch({
                  type: ParticipantsContext.types.UPDATE_TABLE_ORDER,
                  payload: {
                    field: property,
                    direction: order.direction === 'desc' ? 'asc' : 'desc',
                  },
                });
              }}
              rows={rows}
              isLoading={isLoadingData}
            />
          </Box>
        </Grid>
        {!isAdmin && (
          <Menu
            keepMounted
            open={actionMenuParticipant != null && activeModalForm == null}
            anchorEl={anchorElement}
            onClose={() => setActionMenuParticipant(null)}
          >
            {actionMenuParticipant?.status === 'open' && (
              <MenuItem onClick={() => handleEngage(actionMenuParticipant.id, 'prospecting')}>
                Engage
              </MenuItem>
            )}
            {actionMenuParticipant?.status === 'prospecting' && (
              <MenuItem onClick={() => setActiveModalForm('interviewing')}>Interviewing</MenuItem>
            )}
            {actionMenuParticipant?.status === 'interviewing' && (
              <MenuItem onClick={() => handleEngage(actionMenuParticipant.id, 'offer_made')}>
                Offer Made
              </MenuItem>
            )}
            {actionMenuParticipant?.status === 'offer_made' && (
              <MenuItem onClick={() => setActiveModalForm('hired')}>Hire</MenuItem>
            )}
            {['prospecting', 'interviewing', 'offer_made'].includes(
              actionMenuParticipant?.status
            ) && <MenuItem onClick={() => setActiveModalForm('rejected')}>Archive</MenuItem>}
            {actionMenuParticipant?.status === 'rejected' && (
              <MenuItem onClick={() => handleEngage(actionMenuParticipant.id, 'prospecting')}>
                Re-engage
              </MenuItem>
            )}
          </Menu>
        )}
      </CheckPermissions>
    </>
  );
};

export default ParticipantTable;
