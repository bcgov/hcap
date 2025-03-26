import { getPostHireStatusLabel } from '../services';

export const getParticipantGraduationStatus = (participantStatuses) => {
  if (!participantStatuses || participantStatuses.length === 0) return 'Not recorded';
  const graduationStatus = participantStatuses.find(
    (postHireStatus) => postHireStatus.is_current === true
  );
  return getPostHireStatusLabel(graduationStatus);
};
