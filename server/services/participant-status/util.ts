import { collections } from '../../db';
import { ParticipantStatus as ps } from '../../constants';

export const previousStatusesMap = {
  [ps.PROSPECTING]: [null, ps.REJECTED],
  [ps.INTERVIEWING]: [ps.PROSPECTING],
  [ps.OFFER_MADE]: [ps.INTERVIEWING],
  [ps.HIRED]: [ps.OFFER_MADE],
  [ps.ARCHIVED]: [ps.HIRED],
  [ps.REJECTED]: [ps.OFFER_MADE, ps.INTERVIEWING, ps.PROSPECTING, ps.REJECT_ACKNOWLEDGEMENT],
};

// Helper
/**
 * Invalidate all current status for site
 * @param db Database object
 * @param options
 * @param options.site string | number Site ID
 * @param options.participantId  string | number Participant ID string
 * @returns
 */
export const invalidateAllStatusForSite = async (
  db,
  { site, participantId }: { site: string | number; participantId: string | number }
) => {
  if (!db) {
    return;
  }
  await db[collections.PARTICIPANTS_STATUS].update(
    {
      participant_id: participantId,
      current: true,
      'data.site': site,
    },
    {
      current: false,
    }
  );
};
