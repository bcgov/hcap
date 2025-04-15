import { useState, useEffect, useCallback } from 'react';
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

  const handleChangePage = (event, newPage) => {
    setCurrentPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(0);
  };

  const fetchCohortDetails = useCallback(async () => {
    try {
      setIsLoading(true);
      const cohortData = await fetchCohort({ cohortId });
      setCohort(cohortData.cohort);
      setRows(cohortData.participants);
    } catch (err) {
      openToast({
        status: ToastStatus.Error,
        message: err.message || 'Failed to fetch cohort details',
      });
    } finally {
      setIsLoading(false);
    }
  }, [cohortId, openToast]);

  const fetchDataAddParticipantModal = useCallback(async () => {
    try {
      const response = await fetchParticipantsToAssign(
        rowsPerPage,
        currentPage,
        filter.lastName,
        filter.emailAddress
      );
      const participants = response.participants;
      const total = response.total;
      setParticipantsToAssign(participants);
      setTotalParticipants(total);
    } catch (error) {
      openToast({
        status: ToastStatus.Error,
        message: 'Failed to fetch participants to assign',
      });
    }
  }, [rowsPerPage, currentPage, filter.lastName, filter.emailAddress, openToast]);

  const handleRemoveParticipant = useCallback((participantId) => {
    setParticipantToRemove(participantId);
    setOpenConfirmDialog(true);
  }, []);

  const confirmRemoveParticipant = async () => {
    try {
      await removeCohortParticipantPSI(cohortId, participantToRemove);
      openToast({
        status: ToastStatus.Success,
        message: 'Participant removed from cohort successfully',
      });
      fetchCohortDetails();
    } catch (error) {
      openToast({
        status: ToastStatus.Error,
        message: error.message || 'Failed to remove participant from cohort',
      });
    } finally {
      setOpenConfirmDialog(false);
      setParticipantToRemove(null);
    }
  };

  useEffect(() => {
    fetchCohortDetails();
  }, [fetchCohortDetails]);

  useEffect(() => {
    if (cohortId) {
      fetchDataAddParticipantModal();
    }
  }, [cohortId, currentPage, rowsPerPage, filter, fetchDataAddParticipantModal]);

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
    fetchDataAddParticipantModal,
    setCurrentPage,
    confirmRemoveParticipant,
    handleRemoveParticipant,
  };
};

export default useCohortData;
