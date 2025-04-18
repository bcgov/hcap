import React, { useMemo } from 'react';

import { Grid } from '@material-ui/core';

import { AuthContext } from '../../providers';
import { CheckPermissions } from '../../components/generic';

import { FetchMappedPhases } from '../../services/phases';
import { DataTable } from '../../components/tables/DataTable';
import { PhaseDialog } from '../../components/modal-forms';
import { Role } from '../../constants';

export default () => {
  const { auth } = AuthContext.useAuth();
  const roles = useMemo(() => auth.user?.roles || [], [auth.user]);

  /**
   * @type {import("../../components/tables/DataTable").column[]}
   */
  const columns = [
    { id: 'name', name: 'Phase Name' },
    { id: 'start_date', name: 'Start Date', type: 'date' },
    { id: 'end_date', name: 'End Date', type: 'date' },
    { id: 'edit', type: 'button', button: { label: 'Edit', modal: PhaseDialog } },
  ];

  return (
    <>
      <Grid
        container
        alignContent='flex-start'
        justify='flex-start'
        alignItems='center'
        direction='row'
      >
        <CheckPermissions roles={roles} permittedRoles={[Role.MinistryOfHealth]}>
          <DataTable
            columns={columns}
            fetchData={FetchMappedPhases}
            defaultSortColumn='start_date'
            sortOrder='desc'
          />
        </CheckPermissions>
      </Grid>
    </>
  );
};
