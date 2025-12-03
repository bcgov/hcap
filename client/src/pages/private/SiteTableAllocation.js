import React from 'react';
import dayjs from 'dayjs';
import { Box, Typography } from '@mui/material';

export const SiteTableAllocation = ({ row }) => {
  const formattedDate = (date) => dayjs(row[date]).format('MMM D YYYY');

  return (
    <>
      <Box>
        <Typography sx={{ fontWeight: 700 }}>
          {row['allocation'] || row['allocation'] === 0 ? row['allocation'] : 'N/A'}
        </Typography>
        {row['startDate'] ? (
          <Typography sx={{ color: '#272833', fontWeight: 400 }}>
            {formattedDate('startDate')} - {formattedDate('endDate')}
          </Typography>
        ) : (
          <div />
        )}
      </Box>
    </>
  );
};
