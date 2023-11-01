import _ from 'lodash';
import { collections, dbClient } from '../db';
import { ParticipantStatus } from '../constants';

interface WithdrawnParticipant {
  id: number;
  body: {
    history: {
      changes: {
        to: string;
        from: string;
        field: string;
      }[];
      timestamp: string;
    }[];
  };
}

export const getEngagedWithdrawnParticipants = async (): Promise<WithdrawnParticipant[]> =>
  dbClient.db[collections.PARTICIPANTS]
    .join({
      participantStatusJoin: {
        type: 'INNER',
        relation: collections.PARTICIPANTS_STATUS,
        decomposeTo: 'object',
        on: {
          participant_id: 'id',
          current: true,
          'status IN': ['prospecting', 'interviewing', 'offer_made'],
        },
      },
    })
    .find({ 'body.interested': 'withdrawn' });

export const archiveWithdrawnParticipants = async (ids: number[]) => {
  await dbClient.db.withTransaction(async (tx) => {
    const rows = await tx[collections.PARTICIPANTS_STATUS].update(
      {
        'participant_id IN': ids,
        'status IN': ['prospecting', 'interviewing', 'offer_made'],
        current: true,
      },
      {
        current: false,
      }
    );
    await Promise.all(
      _.flatten(
        rows.map(
          // eslint-disable-next-line camelcase
          ({ id, employer_id, participant_id, status, data }) => [
            tx[collections.PARTICIPANTS_STATUS].save({
              employer_id,
              participant_id,
              status: ParticipantStatus.REJECT_ACKNOWLEDGEMENT,
              current: true,
              data: {
                ...(data.site && { site: data.site }),
                refStatus: status,
                refStatusId: id,
                final_status: 'withdrawn',
              },
            }),
            tx[collections.PARTICIPANTS_STATUS].save({
              employer_id,
              participant_id,
              status: ParticipantStatus.REJECTED,
              current: true,
              data: {
                ...(data.site && { site: data.site }),
                final_status: 'withdrawn',
              },
            }),
          ]
        )
      )
    );
  });
};
