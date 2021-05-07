import React, { Fragment } from 'react';
import { useLocation } from 'react-router-dom';
import Alert from '@material-ui/lab/Alert';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';
import EditIcon from '@material-ui/icons/Edit';

import { Routes } from '../../constants';
import { Card, Button } from '../generic';
import { OperatorInfo } from './OperatorInfo';
import { SiteInfo } from './SiteInfo';
import { ExpressionOfInt } from './ExpressionOfInt';
import { WorkforceBaseline } from './WorkforceBaseline';
import { CollectionNotice } from './CollectionNotice';

export const Review = ({ hideCollectionNotice, handleEditClick, isDisabled }) => {
  const location = useLocation();

  return (
    <Fragment>
      <Grid container spacing={3}>
        {!isDisabled && (
          <Grid item xs={12}>
            <Box mb={2}>
              <Alert severity='info'>
                <Typography variant='body2' gutterBottom>
                  <b>Please review your information for accuracy and completeness.</b>
                </Typography>
              </Alert>
            </Box>
          </Grid>
        )}

        <Grid item xs={12}>
          <Card>
            <Box mb={2}>
              <Grid container alignItems='center' justify='space-between'>
                <Grid item>
                  <Typography variant='subtitle1'>1. Operator Contact Information</Typography>
                </Grid>
                {location.pathname === Routes.EmployerForm && (
                  <Grid item>
                    <Button
                      startIcon={<EditIcon />}
                      fullWidth={false}
                      size='small'
                      onClick={() => handleEditClick(1)}
                      text='Edit'
                    />
                  </Grid>
                )}
              </Grid>
            </Box>
            <OperatorInfo isDisabled />
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <Box mb={2}>
              <Grid container alignItems='center' justify='space-between' spacing={2}>
                <Grid item>
                  <Typography variant='subtitle1'>2. Site Information</Typography>
                </Grid>
                {!isDisabled && (
                  <Grid item>
                    <Button
                      startIcon={<EditIcon />}
                      fullWidth={false}
                      size='small'
                      onClick={() => handleEditClick(2)}
                      text='Edit'
                    />
                  </Grid>
                )}
              </Grid>
            </Box>
            <SiteInfo isDisabled />
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <Box mb={2}>
              <Grid container alignItems='center' justify='space-between' spacing={2}>
                <Grid item>
                  <Typography variant='subtitle1'>3. Site Workforce Baseline</Typography>
                </Grid>
                {!isDisabled && (
                  <Grid item>
                    <Button
                      startIcon={<EditIcon />}
                      fullWidth={false}
                      size='small'
                      onClick={() => handleEditClick(3)}
                      text='Edit'
                    />
                  </Grid>
                )}
              </Grid>
            </Box>
            <WorkforceBaseline isDisabled />
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Card>
            <Box mb={2}>
              <Grid container alignItems='center' justify='space-between' spacing={2}>
                <Grid item>
                  <Typography variant='subtitle1'>4. Expression of Interest</Typography>
                </Grid>
                {!isDisabled && (
                  <Grid item>
                    <Button
                      startIcon={<EditIcon />}
                      fullWidth={false}
                      size='small'
                      onClick={() => handleEditClick(4)}
                      text='Edit'
                    />
                  </Grid>
                )}
              </Grid>
            </Box>
            <ExpressionOfInt isDisabled />
          </Card>
        </Grid>
        {!hideCollectionNotice && (
          <Grid item xs={12}>
            <Card>
              <CollectionNotice />
            </Card>
          </Grid>
        )}
      </Grid>
    </Fragment>
  );
};
