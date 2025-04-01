import React from 'react';
import { Grid, Box } from '@material-ui/core';
import { DebounceTextField } from '../../components/generic/DebounceTextField';

export const ParticipantCohortTableFilters = ({ filter, setFilter }) => {
  const handleLastNameFilterChange = (text) => {
    setFilter({ ...filter, lastName: text });
  };

  const handleEmailFilterChange = (text) => {
    setFilter({ ...filter, emailAddress: text });
  };

  return (
    <Grid container>
      <Grid item>
        <Box mt={2}>
          <DebounceTextField
            time={500}
            variant='outlined'
            size='small'
            defaultValue={filter?.lastName || ''}
            onDebounce={handleLastNameFilterChange}
            placeholder='Search by Last Name'
          />
        </Box>
      </Grid>
      <Grid item>
        <Box mt={2} pl={2}>
          <DebounceTextField
            time={500}
            variant='outlined'
            size='small'
            defaultValue={filter?.emailAddress || ''}
            onDebounce={handleEmailFilterChange}
            placeholder='Search by Email Address'
          />
        </Box>
      </Grid>
    </Grid>
  );
};
