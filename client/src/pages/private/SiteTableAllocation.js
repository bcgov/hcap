import React from 'react';

import dayjs from 'dayjs';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import { FeatureFlaggedComponent, flagKeys } from '../../services';

const useStyles = makeStyles((theme) => ({
  allocation: {
    fontWeight: 700,
  },
  dates: {
    color: '#272833',
    fontWeight: 400,
  },
}));

export const SiteTableAllocation = ({ row }) => {
  const classes = useStyles();
  const formattedDate = (date) => dayjs(row[date]).format('MMM D YYYY');

  return (
    <>
      {row['allocation'] || row['startDate'] ? (
        <Box>
          <div className={classes.allocation}>{row['allocation']}</div>
          <FeatureFlaggedComponent featureKey={flagKeys.FEATURE_PHASE_ALLOCATION}>
            <div className={classes.dates}>
              {formattedDate('startDate')} - {formattedDate('endDate')}
            </div>
          </FeatureFlaggedComponent>
        </Box>
      ) : (
        <div className={classes.allocation}>N/A</div>
      )}
    </>
  );
};
