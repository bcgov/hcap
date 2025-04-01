import React from 'react';
import { Table, Button } from '../generic';
import { Link } from '@material-ui/core';
import { getParticipantGraduationStatus } from '../../utils';
import { Role, BUTTON_TEXTS } from '../../constants';

const CohortParticipantsTable = ({
  columns,
  rows,
  isLoading,
  selectedParticipants,
  setSelectedParticipants,
  handleOpenParticipantDetails,
  handleRemoveParticipant,
  handleTransferParticipant,
  roles,
}) => {
  return (
    <Table
      columns={columns}
      rows={rows}
      isLoading={isLoading}
      isMultiSelect={roles.includes(Role.HealthAuthority)}
      selectedRows={selectedParticipants}
      updateSelectedRows={setSelectedParticipants}
      renderCell={(columnId, row) => {
        switch (columnId) {
          case 'firstName':
            return row.body[columnId];
          case 'lastName':
            return (
              <Link
                component='button'
                variant='body2'
                onClick={() => handleOpenParticipantDetails(row.id)}
              >
                {row.body[columnId]}
              </Link>
            );
          case 'siteName':
            return row.siteJoin?.body[columnId];
          case 'graduationStatus':
            return getParticipantGraduationStatus(row.postHireJoin);
          case 'removeButton':
            return (
              <Button
                size='small'
                variant='outlined'
                color='secondary'
                onClick={() => handleRemoveParticipant(row.id)}
                text={BUTTON_TEXTS.REMOVE}
              />
            );
          case 'transferButton':
            return (
              <Button
                size='small'
                variant='outlined'
                onClick={() => handleTransferParticipant(row.id)}
                text={BUTTON_TEXTS.TRANSFER}
              />
            );
          default:
            return row[columnId];
        }
      }}
    />
  );
};

export default CohortParticipantsTable;
