import React, { useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';

import Grid from '@material-ui/core/Grid';
import { Box, Menu, MenuItem, Link } from '@material-ui/core';

import {
  ToastStatus,
  regionLabelsMap,
  makeToasts,
  Routes,
  participantStatus,
  participantEngageStatus,
  pageSizeOptions,
  Role,
  UserRoles,
} from '../../constants';
import { Table, CheckPermissions, Button, CustomTab, CustomTabs } from '../../components/generic';
import { useToast } from '../../hooks';
import { dayUtils, addEllipsisMask, keyedString, capitalizedString } from '../../utils';
import { AuthContext, ParticipantsContext } from '../../providers';
import { ParticipantTableFilters } from './ParticipantTableFilters';
import { ParticipantTableDialogues } from './ParticipantTableDialogues';
import {
  acknowledgeParticipant,
  addParticipantStatus,
  fetchParticipant,
  getParticipants,
  getGraduationStatus,
  fetchUserNotifications,
} from '../../services';
import { ParticipantStatus } from '../../components/generic/ParticipantStatus';

const mapRosData = (data) => ({
  rosSiteName: data?.rosStatuses?.[0]?.rosSite?.body.siteName,
  rosStartDate: dayUtils(data?.rosStatuses?.[0]?.data.date).format('MM/DD/YYYY'),
});

const getStatusForMoH = (isInterested, progressStats) => {
  const mohStatuses = [];
  let firstStatus = 'available';
  let isWithdrawn = false;

  if (!isInterested) {
    firstStatus = 'open';
  }

  if (isInterested === 'no' || isInterested === 'withdrawn') {
    firstStatus = 'withdrawn';
    isWithdrawn = true;
  }

  if (progressStats.total && !progressStats.hired) {
    const count = progressStats.offer_made + progressStats.interviewing + progressStats.prospecting;
    if (count > 0) {
      firstStatus = `inprogress_${count}`;
    }
  }

  if (progressStats.hired) {
    firstStatus = 'hired';
  }

  mohStatuses.push(firstStatus);
  if (isWithdrawn) {
    mohStatuses.push('withdrawn');
  }
  return mohStatuses;
};

const filterData = (data, columns, isMoH = false) => {
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
    row.siteName = item?.statusInfos?.[0].data?.siteName || 'Not Available';
    row.archiveReason = capitalizedString(
      item?.statusInfos?.[0].data?.final_status ||
        item?.statusInfos?.[0].data?.reason ||
        'Not Available'
    );

    if (
      item.rosStatuses &&
      item.rosStatuses.length > 0 &&
      item.statusInfos?.[0].status !== 'archived'
    ) {
      const archivedStatuses =
        item.statusInfos?.filter(
          (statusInfo) =>
            statusInfo.status === 'withdrawn' ||
            statusInfo.status === 'pending_acknowledgement' ||
            statusInfo.status === 'hired_by_peer'
        ) ?? [];
      const otherStatuses = archivedStatuses.map((statusInfo) => statusInfo.status);
      row.status = ['ros', ...otherStatuses];
    } else if (item.statusInfos && item.statusInfos.length > 0) {
      // Handling already_hired and withdrawn status
      const previousStatus = item.statusInfos.find((statusInfo) => statusInfo.data?.previous);
      if (item.statusInfos.find((statusInfo) => statusInfo.status === 'withdrawn')) {
        row.status = [previousStatus?.data.previous || item.statusInfos[0].status, 'withdrawn'];
      } else if (item.statusInfos.find((statusInfo) => statusInfo.status === 'already_hired')) {
        row.status = [previousStatus?.data.previous || item.statusInfos[0].status, 'already_hired'];
      } else if (item.statusInfos.find((statusInfo) => statusInfo.status === 'hired_by_peer')) {
        row.status = [previousStatus?.data.previous || item.statusInfos[0].status, 'hired_by_peer'];
      } else {
        row.status = [item.statusInfos[0].status];
      }
    } else if (item.progressStats) {
      if (isMoH) {
        row.mohStatus = getStatusForMoH(item.interested, item.progressStats);
        row.status = ['open'];
      } else {
        row.status = [
          'open',
          ...Object.keys(item.progressStats).filter((key) => key === 'archived'),
        ];
      }
    } else {
      row.status = ['open'];
    }

    // Manage employer name
    const maxStrLen = 50;
    const statusWithEmployerDetails =
      item.statusInfos?.filter((statusInfo) => statusInfo.employerInfo) || [];
    if (statusWithEmployerDetails.length > 0) {
      row.employerName = `${addEllipsisMask(
        statusWithEmployerDetails[0].employerInfo.firstName,
        maxStrLen
      )} ${addEllipsisMask(statusWithEmployerDetails[0].employerInfo.lastName, maxStrLen)}`;

      const createdAtFormatted = dayUtils(statusWithEmployerDetails[0].createdAt).format(
        'MMM DD, YYYY'
      );
      row.lastEngagedDate = createdAtFormatted;
      row.lastEngagedBy = row.employerName;
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
  const [selectedParticipants, setSelectedParticipants] = useState([]);
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
  const { auth, dispatch } = AuthContext.useAuth();
  const roles = useMemo(() => auth.user?.roles || [], [auth.user?.roles]);

  const isMoH = roles.includes(Role.MinistryOfHealth);
  const isSuperUser = roles.includes(Role.Superuser);
  const isAdmin = isMoH || isSuperUser;
  const isHA = roles.includes(Role.HealthAuthority);
  const isEmployer = roles.includes(Role.Employer);

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
    const newRows = filterData(data, columns, isMoH);
    setRows(newRows);
    setLoadingData(false);
  };

  const bulkEngage = () => {
    openParticipantMultiSelectSite();
  };

  const openParticipantSelectSite = () => {
    setActiveModalForm(participantEngageStatus.SINGLE_SELECT_SITE);
  };

  const openParticipantMultiSelectSite = () => {
    setActiveModalForm(participantEngageStatus.MULTI_SELECT_SITE);
  };

  const handleEngage = async (participantId, status, additional = {}, participantInfo = null) => {
    let closeModal = true;
    try {
      if (isLoadingData) {
        return;
      }
      setLoadingData(true);
      // Adding site from exiting statuses
      const participant =
        actionMenuParticipant || rows.find((row) => row.id === participantId)?.engage || {};
      const statusInfo =
        participant.statusInfos && participant.statusInfos.length > 0
          ? participant.statusInfos[0]
          : {};
      const site = statusInfo.data?.site;
      const currentStatusId = statusInfo?.id;
      const additionalParma = {
        ...(site && { sites: [site] }),
        ...(currentStatusId && { currentStatusId }),
        ...additional,
      };
      const { data } = await addParticipantStatus({
        participantId,
        status,
        additional: additionalParma,
      });
      const dispatchFunction = (notifications) =>
        dispatch({ type: AuthContext.USER_NOTIFICATIONS_UPDATED, payload: notifications });
      fetchUserNotifications(dispatchFunction);
      setLoadingData(false);
      if (status === participantStatus.PROSPECTING && data.status === status) {
        // Modal appears after submitting
        setActiveModalForm(participantStatus.PROSPECTING);
        closeModal = false;
      } else {
        const index = rows.findIndex((row) => row.id === participantId);
        const { firstName, lastName } = rows[index];
        const toasts = makeToasts(firstName, lastName);
        openToast(
          toasts[
            ['already_hired', 'invalid_status_transition', 'invalid_archive'].includes(data?.status)
              ? data.status
              : status
          ]
        );
      }
    } catch (err) {
      setLoadingData(false);
      openToast({
        status: ToastStatus.Error,
        message: err.message || 'Server error',
      });
    }

    // Reload
    if (closeModal) {
      setActionMenuParticipant(null);
      setActiveModalForm(null);
    }
    fetchParticipants();
  };

  const handleUpdate = (isSuccess, resMessage) => {
    if (isSuccess) {
      openToast({
        status: ToastStatus.Success,
        message: resMessage,
      });

      const dispatchFunction = (notifications) =>
        dispatch({ type: AuthContext.USER_NOTIFICATIONS_UPDATED, payload: notifications });
      fetchUserNotifications(dispatchFunction);

      fetchParticipants();
    } else {
      openToast({
        status: ToastStatus.Error,
        message: resMessage,
      });
    }
  };

  const handleAcknowledge = async (id, multiOrgHire, participantInfoData = null) => {
    try {
      // Need to find status for participant
      const participantInfo =
        participantInfoData || rows.find((row) => row.id === id)?.engage || {};
      const statusInfo =
        participantInfo.statusInfos && participantInfo.statusInfos.length > 0
          ? participantInfo.statusInfos[0]
          : {};
      const { message, success } = await acknowledgeParticipant({
        participantId: id,
        multiOrgHire,
        currentStatusId: statusInfo?.id,
      });

      openToast({
        status: success ? ToastStatus.Success : ToastStatus.Warning,
        message: message || 'Update successful',
      });

      setActionMenuParticipant(null);
      setSelectedParticipants([]);
      setActiveModalForm(null);
      fetchParticipants();
    } catch (err) {
      openToast({
        status: ToastStatus.Error,
        message: err.message || 'An error occurred',
      });
    }
  };

  const openFormForParticipant = async (participantId, formKey) => {
    if (formKey === 'edit-participant') {
      const participant = await fetchParticipant({ id: participantId });
      setActionMenuParticipant(participant);
    }
    setActiveModalForm(formKey);
  };

  const handleDialogueClose = () => {
    setActiveModalForm(null);
    setActionMenuParticipant(null);
    setSelectedParticipants([]);
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
    setSelectedParticipants([]);
    fetchParticipants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, pagination.page, pagination.pageSize, order, selectedTabStatuses, siteSelector]);

  const renderCell = (columnId, row) => {
    switch (columnId) {
      case 'lastName':
        if (
          isAdmin ||
          ((isEmployer || isHA) && ['Hired Candidates', 'Return Of Service'].includes(selectedTab))
        ) {
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
      case 'mohStatus':
        const status = row[columnId] || row['status'];
        return (
          <ParticipantStatus
            status={status}
            id={row.id}
            tabValue={selectedTab}
            handleEngage={handleEngage}
            handleAcknowledge={handleAcknowledge}
            isMoH={isMoH}
            participantInfo={row.engage || null}
          />
        );
      case 'distance':
        if (row[columnId] !== null && row[columnId] !== undefined) {
          return `${Math.round(row[columnId] / 1000) || '<1'} Km`;
        }
        return 'N/A';
      case 'engage':
        const engage = ![
          'hired_by_peer',
          'already_hired',
          'withdrawn',
          'archived',
          'reject_ack',
        ].find((participantStatus) => row.status.includes(participantStatus));

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
        return dayUtils(row.userUpdatedAt).fromNow();
      case 'archive':
        return (
          <>
            {!row.status.includes('withdrawn') && (
              <Button
                onClick={(event) => {
                  setActionMenuParticipant(row.engage);
                  setAnchorElement(event.currentTarget);
                }}
                variant='outlined'
                size='small'
                text='Actions'
              />
            )}
          </>
        );
      case 'postHireStatuses':
        return getGraduationStatus(row[columnId] || []);
      case 'rosStartDate':
        return row[columnId] ?? 'N/A';
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
        bulkParticipants={selectedParticipants}
        handleEngage={handleEngage}
        onClose={handleDialogueClose}
        handleUpdate={handleUpdate}
      />
      <CheckPermissions permittedRoles={UserRoles} renderErrorMessage={true}>
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

          <Box py={2} px={2} width='100%'>
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
              totalRowsCount={pagination.total}
              onChangePage={(_, newPage) => {
                participantsDispatch({
                  type: ParticipantsContext.types.UPDATE_PAGINATION,
                  payload: { page: newPage },
                });
              }}
              onChangePageSize={(newPageSize) => {
                participantsDispatch({
                  type: ParticipantsContext.types.UPDATE_PAGE_SIZE,
                  payload: { pageSize: newPageSize },
                });
              }}
              rowsPerPage={pagination.pageSize}
              rowsPerPageOptions={pageSizeOptions}
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
              isMultiSelect={selectedTab === 'Available Participants' && isHA}
              selectedRows={selectedParticipants}
              updateSelectedRows={setSelectedParticipants}
              multiSelectAction={bulkEngage}
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
              <MenuItem onClick={() => openParticipantSelectSite()}>Engage</MenuItem>
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
            {['hired', 'ros'].includes(actionMenuParticipant?.status) && (
              <MenuItem
                onClick={() => openFormForParticipant(actionMenuParticipant?.id, 'archive')}
              >
                Archive
              </MenuItem>
            )}
            {actionMenuParticipant?.status === 'ros' && (
              <MenuItem
                onClick={() => openFormForParticipant(actionMenuParticipant?.id, 'change-site')}
              >
                Change Site
              </MenuItem>
            )}
            {actionMenuParticipant?.status === 'hired' &&
              actionMenuParticipant?.rosStatuses.length === 0 &&
              getGraduationStatus(actionMenuParticipant.postHireStatuses) !== 'No' && (
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
