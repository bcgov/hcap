import React from 'react';

import dayjs from 'dayjs';
import { Box } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

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
      <Box>
        <div className={classes.allocation}>
          {row['allocation'] || row['allocation'] === 0 ? row['allocation'] : 'N/A'}
        </div>
        {row['startDate'] ? (
          <div className={classes.dates}>
            {formattedDate('startDate')} - {formattedDate('endDate')}
          </div>
        ) : (
          <div />
        )}
      </Box>
    </>
  );
};
