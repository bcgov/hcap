import { useState, useEffect, useCallback } from 'react';
import { fetchCohort, fetchParticipantsToAssign } from '../services';
import { useToast } from '../hooks';
import { ToastStatus } from '../constants';

export const useCohortData = (cohortId) => {
  const { openToast } = useToast();
  const [cohort, setCohort] = useState(null);
  const [participantsToAssign, setParticipantsToAssign] = useState(null);
  const [totalParticipants, setTotalParticipants] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [filter, setFilter] = useState({ lastName: '', emailAddress: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState([]);

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

  const fetchDataAddParticipantModal = async () => {
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
  };

  useEffect(() => {
    fetchCohortDetails();
  }, []);

  useEffect(() => {
    if (cohortId) {
      fetchDataAddParticipantModal();
    }
  }, [cohortId, currentPage, rowsPerPage, filter]);

  return {
    cohort,
    rows,
    isLoading,
    participantsToAssign,
    totalParticipants,
    currentPage,
    rowsPerPage,
    filter,
    setFilter,
    setCurrentPage,
    setRowsPerPage,
    setParticipantsToAssign,
    setTotalParticipants,
    setCohort,
    setIsLoading,
    fetchCohortDetails,
    fetchDataAddParticipantModal,
  };
};

export default useCohortData;
