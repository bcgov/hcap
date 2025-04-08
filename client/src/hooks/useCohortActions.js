import { useState, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { Routes, ToastStatus } from '../constants';
import { keyedString } from '../utils';
import { useCohortData, useToast } from './';
import { fetchParticipant, getPsi } from '../services';

export const useCohortActions = (cohortId) => {
  const history = useHistory();

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [allCohorts, setAllCohorts] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [disableAssign, setDisableAssign] = useState(false);

  const { setIsLoading } = useCohortData(cohortId);
  const { openToast } = useToast();

  const handleOpenParticipantDetails = useCallback(
    (participantId) => {
      history.push(
        keyedString(Routes.ParticipantDetails, {
          id: participantId,
          page: 'cohort-details',
          pageId: cohortId,
        })
      );
    },
    [history, cohortId]
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
    [openToast, setIsLoading]
  );

  const handleTransferParticipant = useCallback(
    (participantId) => {
      setTransferModalOpen(true);
      fetchTransferData(participantId);
    },
    [fetchTransferData]
  );

  return {
    handleOpenParticipantDetails,
    handleTransferParticipant,
    selectedParticipant,
    allCohorts,
    transferModalOpen,
    setTransferModalOpen,
    disableAssign,
  };
};
