import React, { useMemo } from 'react';
import Grid from '@material-ui/core/Grid';
import { Box, Typography, TextField, MenuItem, Checkbox, FormLabel } from '@material-ui/core';
import { DebounceTextField } from '../../components/generic/DebounceTextField';
import { AuthContext, ParticipantsContext } from '../../providers';

export const ParticipantTableFilters = ({ loading, locations, reducerState, dispatch }) => {
  const {
    state: { columns, selectedTab },
  } = ParticipantsContext.useParticipantsContext();
  const { auth } = AuthContext.useAuth();
  const roles = useMemo(() => auth.user?.roles || [], [auth.user?.roles]);
  const sites = useMemo(() => auth.user?.sites || [], [auth.user?.sites]);
  const hideLastNameAndEmailFilter = selectedTab === 'Archived Candidates';

  const isMoH = roles.includes('ministry_of_health');

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
            value={reducerState.locationFilter || ''}
            disabled={loading || locations.length === 1}
            onChange={({ target }) =>
              dispatch({
                type: 'updateKey',
                key: 'locationFilter',
                value: target.value,
              })
            }
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
          <DebounceTextField
            time={1000}
            variant='filled'
            fullWidth
            value={reducerState.fsaText}
            disabled={loading}
            onDebounce={(text) => dispatch({ type: 'updateFilter', key: 'fsaFilter', value: text })}
            onChange={({ target }) =>
              dispatch({ type: 'updateKey', key: 'fsaText', value: target.value })
            }
            placeholder='Forward Sortation Area'
          />
        </Box>
      </Grid>
      <Grid item>
        <Box pl={2}>
          {!hideLastNameAndEmailFilter && (
            <DebounceTextField
              time={1000}
              variant='filled'
              fullWidth
              value={reducerState.lastNameText}
              disabled={loading}
              onDebounce={(text) =>
                dispatch({ type: 'updateFilter', key: 'lastNameFilter', value: text })
              }
              onChange={({ target }) =>
                dispatch({ type: 'updateKey', key: 'lastNameText', value: target.value })
              }
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
              value={reducerState.emailText}
              disabled={loading}
              onDebounce={(text) =>
                dispatch({ type: 'updateFilter', key: 'emailFilter', value: text })
              }
              onChange={({ target }) =>
                dispatch({ type: 'updateKey', key: 'emailText', value: target.value })
              }
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
              value={reducerState.siteSelector || ''}
              disabled={loading}
              onChange={({ target }) =>
                dispatch({ type: 'updateSiteSelector', value: target.value })
              }
              aria-label='site selector'
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
            onChange={() => {
              const newValue = reducerState?.isIndigenousFilter === 'true' ? '' : 'true';
              dispatch({
                type: 'updateKey',
                key: 'isIndigenousFilter',
                value: newValue,
              });
            }}
          />
          <FormLabel htmlFor={'isIndigenousFilterCheckbox'} style={{ paddingTop: '13px' }}>
            Indigenous participants only
          </FormLabel>
        </Grid>
      )}
    </>
  );
};
