import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchCohort, fetchParticipantsToAssign, removeCohortParticipantPSI } from '../services';
import { useToast } from '../hooks';
import { ToastStatus, ROWS_PER_PAGE_OPTIONS } from '../constants';

export const useCohortData = (cohortId) => {
  const { openToast } = useToast();
  const [cohort, setCohort] = useState(null);
  const [participantsToAssign, setParticipantsToAssign] = useState(null);
  const [participantToRemove, setParticipantToRemove] = useState(null);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [filter, setFilter] = useState({ lastName: '', emailAddress: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(ROWS_PER_PAGE_OPTIONS[0]);
  const hasInitiallyFetched = useRef(false);

  const handleChangePage = useCallback((event, newPage) => {
    setCurrentPage(newPage);
  }, []);

  const handleChangeRowsPerPage = useCallback((event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(0);
  }, []);

  const fetchCohortDetails = useCallback(async () => {
    if (hasInitiallyFetched.current) {
      console.log('Skipping redundant fetchCohortDetails call');
      return;
    }

    try {
      setIsLoading(true);
      const cohortData = await fetchCohort({ cohortId });
      setCohort(cohortData.cohort);
      setRows(cohortData.participants);
      hasInitiallyFetched.current = true;
    } catch (err) {
      console.error('Error fetching cohort details:', err);
      openToast({
        status: ToastStatus.Error,
        message: err.message || 'Failed to fetch cohort details',
      });
    } finally {
      setIsLoading(false);
    }
  }, [cohortId, openToast]);

  const refreshCohortDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const cohortData = await fetchCohort({ cohortId });
      setCohort(cohortData.cohort);
      setRows(cohortData.participants);
    } catch (err) {
      console.error('Error refreshing cohort details:', err);
      openToast({
        status: ToastStatus.Error,
        message: err.message || 'Failed to refresh cohort details',
      });
    } finally {
      setIsLoading(false);
    }
  }, [cohortId, openToast]);

  const fetchDataAddParticipantModal = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetchParticipantsToAssign(
        rowsPerPage,
        currentPage,
        filter.lastName,
        filter.emailAddress,
      );
      const participants = response.participants;
      const total = response.total;
      setParticipantsToAssign(participants);
      setTotalParticipants(total);
    } catch (error) {
      console.error('Error fetching participants to assign:', error);
      setParticipantsToAssign([]);
      setTotalParticipants(0);
      openToast({
        status: ToastStatus.Error,
        message: error.message || 'Failed to fetch participants to assign',
      });
    } finally {
      setIsLoading(false);
    }
  }, [rowsPerPage, currentPage, filter.lastName, filter.emailAddress, openToast]);

  const handleRemoveParticipant = useCallback((participantId) => {
    setParticipantToRemove(participantId);
    setOpenConfirmDialog(true);
  }, []);

  const confirmRemoveParticipant = useCallback(async () => {
    try {
      await removeCohortParticipantPSI(cohortId, participantToRemove);
      openToast({
        status: ToastStatus.Success,
        message: 'Participant removed from cohort successfully',
      });
      // Refresh updated data
      refreshCohortDetails();
    } catch (error) {
      openToast({
        status: ToastStatus.Error,
        message: error.message || 'Failed to remove participant from cohort',
      });
    } finally {
      setOpenConfirmDialog(false);
      setParticipantToRemove(null);
    }
  }, [cohortId, participantToRemove, openToast, refreshCohortDetails]);

  // Initial fetch of cohort details - ONLY ONCE
  useEffect(() => {
    if (!hasInitiallyFetched.current) {
      fetchCohortDetails();
    }
  }, [fetchCohortDetails]);

  return {
    openConfirmDialog,
    setOpenConfirmDialog,
    cohort,
    rows,
    isLoading,
    setIsLoading,
    participantsToAssign,
    totalParticipants,
    currentPage,
    rowsPerPage,
    filter,
    setFilter,
    handleChangePage,
    handleChangeRowsPerPage,
    fetchCohortDetails,
    refreshCohortDetails,
    fetchDataAddParticipantModal,
    setCurrentPage,
    confirmRemoveParticipant,
    handleRemoveParticipant,
  };
};

export default useCohortData;
