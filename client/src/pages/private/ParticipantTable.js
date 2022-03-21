import React, { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import Grid from '@material-ui/core/Grid';
import { Box, Menu, MenuItem, Link } from '@material-ui/core';
import {
  ToastStatus,
  regionLabelsMap,
  pageSize,
  makeToasts,
  Routes,
  participantStatus,
} from '../../constants';
import { Table, CheckPermissions, Button, CustomTab, CustomTabs } from '../../components/generic';
import { useToast } from '../../hooks';
import { prettifyStatus, keyedString } from '../../utils';
import moment from 'moment';
import { AuthContext, ParticipantsContext } from '../../providers';
import { ParticipantTableFilters } from './ParticipantTableFilters';
import { ParticipantTableDialogues } from './ParticipantTableDialogues';
import {
  acknowledgeParticipant,
  addParticipantStatus,
  fetchParticipant,
  getParticipants,
  getGraduationStatus,
} from '../../services/participant';

const mapRosData = (data) => ({
  rosSiteName: data?.rosStatuses?.[0]?.site?.body.siteName,
  rosStartDate: moment(data?.rosStatuses?.[0]?.data.date).format('MM/DD/YYYY'),
});

const filterData = (data, columns) => {
  const emailAddressMask = '***@***.***';
  const phoneNumberMask = '(***) ***-****';

  const mapItemToColumns = (item, columns) => {
    const row = {};
    const finalItem =
      item.rosStatuses && item.rosStatuses.length > 0
        ? { ...item, ...mapRosData(item) }
        : { ...item };

    columns.forEach((column) => {
      if (finalItem[column.id]) {
        row[column.id] = finalItem[column.id];
      }
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
    if (item.rosStatuses && item.rosStatuses.length > 0) {
      row.status = ['ros'];
    } else if (item.statusInfos && item.statusInfos.length > 0) {
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

  const isMoH = roles.includes('ministry_of_health');
  const isSuperUser = roles.includes('superuser');
  const isAdmin = isMoH || isSuperUser;
  const isEmployer = roles.includes('health_authority') || roles.includes('employer');

  const fetchParticipants = async () => {
    if (!columns) return;
    setLoadingData(true);
    const { data, pagination: newPagination } = await getParticipants({
      pagination,
      filter,
      order,
      siteSelector,
      selectedTabStatuses,
    });
    participantsDispatch({
      type: ParticipantsContext.types.UPDATE_PAGINATION,
      payload: newPagination,
    });
    const newRows = filterData(data, columns);
    setRows(newRows);
    setLoadingData(false);
  };

  const handleEngage = async (participantId, status, additional = {}) => {
    try {
      const { data } = await addParticipantStatus({ participantId, status, additional });

      if (status === participantStatus.PROSPECTING) {
        // Modal appears after submitting
        setActiveModalForm(participantStatus.PROSPECTING);
      } else {
        const index = rows.findIndex((row) => row.id === participantId);
        const { firstName, lastName } = rows[index];
        const toasts = makeToasts(firstName, lastName);
        openToast(toasts[data?.status === 'already_hired' ? data.status : status]);
        setActionMenuParticipant(null);
        setActiveModalForm(null);
        fetchParticipants();
      }
    } catch (err) {
      openToast({
        status: ToastStatus.Error,
        message: err.message || 'Server error',
      });
    }
  };

  const handleRosUpdate = (success) => {
    if (success) {
      openToast({
        status: ToastStatus.Success,
        message: 'Return of Service status updated',
      });
      fetchParticipants();
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      await acknowledgeParticipant(id);

      openToast({
        status: ToastStatus.Success,
        message: 'Update successful',
      });

      setActionMenuParticipant(null);
      setActiveModalForm(null);
      fetchParticipants();
    } catch (err) {
      openToast({
        status: ToastStatus.Error,
        message: 'An error occured',
      });
    }
  };

  const openFormForParticipant = async (participantId, formKey) => {
    const participant = await fetchParticipant({ id: participantId });
    setActionMenuParticipant(participant);
    setActiveModalForm(formKey);
  };

  const handleDialogueClose = () => {
    setActiveModalForm(null);
    setActionMenuParticipant(null);
  };

  // Set available locations
  useEffect(() => {
    // Either returns all location roles or a role mapping with a Boolean filter removes all undefined values
    const regions = Object.values(regionLabelsMap).filter((value) => value !== 'None');
    setLocations(
      isMoH || isSuperUser ? regions : roles.map((loc) => regionLabelsMap[loc]).filter(Boolean)
    );
  }, [isMoH, isSuperUser, roles]);

  useEffect(() => {
    fetchParticipants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, pagination.page, order, selectedTabStatuses, siteSelector]);

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
                  pageId: 'none',
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
            onClick={() => openFormForParticipant(row.id, 'edit-participant')}
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
            {!row.status.includes('withdrawn') &&
              (row.status.includes('ros') ? (
                <Button
                  onClick={() => openFormForParticipant(row.id, 'archive')}
                  variant='outlined'
                  size='small'
                  text='Archive'
                />
              ) : (
                <Button
                  onClick={(event) => {
                    setActionMenuParticipant(row.engage);
                    setAnchorElement(event.currentTarget);
                  }}
                  variant='outlined'
                  size='small'
                  text='Actions'
                />
              ))}
          </>
        );
      case 'postHireStatuses':
        return getGraduationStatus(row[columnId] || []);
      default:
        return row[columnId];
    }
    return row[columnId];
  };

  if (!columns) return null;
  return (
    <>
      <ParticipantTableDialogues
        fetchParticipants={fetchParticipants}
        activeModalForm={activeModalForm}
        actionMenuParticipant={actionMenuParticipant}
        handleEngage={handleEngage}
        onClose={handleDialogueClose}
        handleRosUpdate={handleRosUpdate}
      />
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
            <ParticipantTableFilters
              fetchParticipants={fetchParticipants}
              loading={isLoadingData}
              locations={locations}
            />

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
            {actionMenuParticipant?.status === 'hired' && (
              <MenuItem
                onClick={() => openFormForParticipant(actionMenuParticipant?.id, 'archive')}
              >
                Archive
              </MenuItem>
            )}
            {actionMenuParticipant?.status === 'hired' &&
              actionMenuParticipant?.rosStatuses.length === 0 && (
                <MenuItem
                  onClick={() =>
                    openFormForParticipant(actionMenuParticipant?.id, 'return-of-service')
                  }
                >
                  Return Of Service
                </MenuItem>
              )}
          </Menu>
        )}
      </CheckPermissions>
    </>
  );
};

export default ParticipantTable;
