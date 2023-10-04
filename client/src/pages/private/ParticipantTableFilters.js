import React, { useMemo } from 'react';
import Grid from '@material-ui/core/Grid';
import { Box, Typography, TextField, MenuItem, Checkbox, FormLabel } from '@material-ui/core';
import { CheckPermissions } from '../../components/generic';
import { DebounceTextField } from '../../components/generic/DebounceTextField';
import { AuthContext, ParticipantsContext } from '../../providers';
import { FILTERABLE_FIELDS, Role } from '../../constants';

export const ParticipantTableFilters = ({ loading, locations, programs }) => {
  const {
    state: { columns, selectedTab, filter, siteSelector },
    dispatch,
  } = ParticipantsContext.useParticipantsContext();
  const { auth } = AuthContext.useAuth();
  const roles = useMemo(() => auth.user?.roles || [], [auth.user?.roles]);
  const sites = useMemo(() => auth.user?.sites || [], [auth.user?.sites]);
  const hideLastNameAndEmailFilter = selectedTab === 'Archived Candidates';

  const isMoH = roles.includes(Role.MinistryOfHealth);

  const setFilter = (key, value) => {
    dispatch({
      type: ParticipantsContext.types.UPDATE_FILTER,
      payload: {
        key: key,
        value,
      },
    });
  };

  if (!columns) return null;
  return (
    <>
      <Grid item>
        <Box pl={2} pr={2} pt={1}>
          <Typography variant='body1' gutterBottom>
            Filter:
          </Typography>
        </Box>
      </Grid>
      <Grid item>
        <Box>
          <TextField
            select
            fullWidth
            variant='filled'
            inputProps={{ displayEmpty: true }}
            disabled={loading || locations.length === 1}
            value={filter[FILTERABLE_FIELDS.REGION]?.value || ''}
            onChange={({ target }) => setFilter(FILTERABLE_FIELDS.REGION, target.value)}
            aria-label='location filter'
          >
            {locations.length === 1 ? (
              <MenuItem value=''>{locations[0]}</MenuItem>
            ) : (
              ['Preferred Location', ...locations].map((option, index) => (
                <MenuItem key={option} value={index === 0 ? '' : option} aria-label={option}>
                  {option}
                </MenuItem>
              ))
            )}
          </TextField>
        </Box>
      </Grid>
      <Grid item>
        <Box pl={2}>
          <TextField
            select
            fullWidth
            variant='filled'
            inputProps={{ displayEmpty: true }}
            disabled={loading || programs.length === 1}
            value={filter[FILTERABLE_FIELDS.PROGRAM]?.value || ''}
            onChange={({ target }) => setFilter(FILTERABLE_FIELDS.PROGRAM, target.value)}
            aria-label='program filter'
          >
            {programs.length === 1 ? (
              <MenuItem value=''>{programs[0]}</MenuItem>
            ) : (
              ['Program', ...programs].map((option, index) => (
                <MenuItem key={option} value={index === 0 ? '' : option} aria-label={option}>
                  {option}
                </MenuItem>
              ))
            )}
          </TextField>
        </Box>
      </Grid>
      <CheckPermissions permittedRoles={[Role.Employer, Role.HealthAuthority]}>
        <Grid item>
          <Box pl={2}>
            <DebounceTextField
              time={1000}
              variant='filled'
              fullWidth
              disabled={loading}
              defaultValue={filter[FILTERABLE_FIELDS.FSA]?.value || ''}
              onDebounce={(text) => setFilter(FILTERABLE_FIELDS.FSA, text)}
              placeholder='Forward Sortation Area'
            />
          </Box>
        </Grid>
      </CheckPermissions>
      {isMoH && (
        <Grid item>
          <Box pl={2}>
            <DebounceTextField
              time={1000}
              variant='filled'
              fullWidth
              disabled={loading}
              defaultValue={filter[FILTERABLE_FIELDS.ID]?.value || ''}
              onDebounce={(text) => setFilter(FILTERABLE_FIELDS.ID, text)}
              placeholder='Participant ID'
            />
          </Box>
        </Grid>
      )}
      <Grid item>
        <Box pl={2}>
          {!hideLastNameAndEmailFilter && (
            <DebounceTextField
              time={1000}
              variant='filled'
              fullWidth
              disabled={loading}
              defaultValue={filter[FILTERABLE_FIELDS.LASTNAME]?.value || ''}
              onDebounce={(text) => setFilter(FILTERABLE_FIELDS.LASTNAME, text)}
              placeholder='Last Name'
            />
          )}
        </Box>
      </Grid>
      <Grid item>
        <Box pl={2}>
          {!hideLastNameAndEmailFilter && (
            <DebounceTextField
              time={1000}
              variant='filled'
              fullWidth
              disabled={loading}
              defaultValue={filter[FILTERABLE_FIELDS.EMAIL]?.value}
              onDebounce={(text) => setFilter(FILTERABLE_FIELDS.EMAIL, text)}
              placeholder='Email'
            />
          )}
        </Box>
      </Grid>

      {!isMoH && (
        <Grid item style={{ marginLeft: 20, paddingBottom: 18 }}>
          <Typography>Site for distance calculation: </Typography>
          <Box>
            <TextField
              select
              fullWidth
              variant='filled'
              inputProps={{ displayEmpty: true }}
              value={siteSelector || ''}
              disabled={loading}
              aria-label='site selector'
              onChange={({ target }) =>
                dispatch({
                  type: ParticipantsContext.types.UPDATE_SITE_SELECTOR,
                  payload: target.value,
                })
              }
            >
              {[{ siteName: 'Select Site', siteId: null }, ...sites].map((option, index) => (
                <MenuItem
                  key={option.siteId}
                  value={index === 0 ? '' : option.siteId}
                  aria-label={option?.siteName}
                >
                  {option?.siteName}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </Grid>
      )}
      {!isMoH && (
        <Grid container item xs={2} style={{ paddingLeft: '10px' }}>
          <Checkbox
            id={'isIndigenousFilterCheckbox'}
            color='primary'
            disabled={loading}
            onChange={({ target }) => setFilter(FILTERABLE_FIELDS.IS_INDIGENOUS, target.checked)}
          />
          <FormLabel htmlFor={'isIndigenousFilterCheckbox'} style={{ paddingTop: '13px' }}>
            Indigenous participants only
          </FormLabel>
        </Grid>
      )}
    </>
  );
};
