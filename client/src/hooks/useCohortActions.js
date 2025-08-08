import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Routes, ToastStatus } from '../constants';
import { keyedString } from '../utils';
import { useToast } from './';
import { fetchParticipant, getPsi } from '../services';

export const useCohortActions = (cohortId) => {
  const navigate = useNavigate();

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [allCohorts, setAllCohorts] = useState([]);

  const [disableAssign, setDisableAssign] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { openToast } = useToast();

  const handleOpenParticipantDetails = useCallback(
    (participantId) => {
      navigate(
        keyedString(Routes.ParticipantDetailsPath, {
          id: participantId,
          page: 'cohort-details',
          pageId: cohortId,
        }),
      );
    },
    [navigate, cohortId],
  );

  const fetchTransferData = useCallback(
    async (participantId) => {
      try {
        setIsLoading(true);

        // Fetch all cohorts
        const list = await getPsi();
        setAllCohorts(list);

        // Fetch participant details
        const participant = await fetchParticipant({ id: participantId });
        setSelectedParticipant(participant);

        if (
          participant.interested?.toLowerCase() === 'withdrawn' ||
          participant.interested?.toLowerCase() === 'no'
        ) {
          setDisableAssign(true);
          return;
        }
      } catch (error) {
        console.error('Error fetching transfer data:', error);
        openToast({
          status: ToastStatus.Error,
          message: 'Failed to fetch participant details or cohorts',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [openToast],
  );

  const handleTransferParticipant = useCallback(
    (participantId) => {
      setTransferModalOpen(true);
      fetchTransferData(participantId);
    },
    [fetchTransferData],
  );

  return {
    handleOpenParticipantDetails,
    handleTransferParticipant,
    selectedParticipant,
    allCohorts,
    transferModalOpen,
    setTransferModalOpen,
    disableAssign,
    isLoading,
  };
};
