/* eslint-disable camelcase */
import { dbClient, collections } from '../db';
import { ParticipantStatus, Program } from '../constants';

exports.up = async (pgm) => {
  pgm.addColumn(
    'site_phase_allocation',
    {
      mhaw_allocation: {
        type: 'integer',
        notNull: true,
        default: 0,
      },
    },
    { ifNotExists: true }
  );
  await dbClient.db[collections.PARTICIPANTS_STATUS].updateDoc(
    {
      status: ParticipantStatus.HIRED,
      'data.nonHcapOpportunity::bool': true,
    },
    { program: Program.NonHCAP },
    { body: 'data' }
  );
  await dbClient.db[collections.PARTICIPANTS_STATUS].updateDoc(
    {
      status: ParticipantStatus.HIRED,
      or: [{ 'data.nonHcapOpportunity::bool !=': true }, { 'data.nonHcapOpportunity IS': null }],
    },
    { program: Program.HCA },
    { body: 'data' }
  );
};

exports.down = async (pgm) => {
  pgm.dropColumns('site_phase_allocation', ['mhaw_allocation']);
};
