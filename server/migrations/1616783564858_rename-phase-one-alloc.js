import { dbClient, collections } from '../db';

exports.up = async () => {
  await dbClient.db.query(
    `UPDATE ${collections.EMPLOYER_SITES} SET body = body - 'phaseOneAllocation' || jsonb_build_object('allocation', body->'phaseOneAllocation')`
  );
};
