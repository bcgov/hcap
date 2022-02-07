import { Grid, Typography, Dialog } from '@material-ui/core';
import { Button } from '../../components/generic/Button';

import { ManageGraduationForm } from '../modal-forms/ManageGraduationForm';
import React, { useState } from 'react';
import moment from 'moment';
import { createPostHireStatus } from '../../services/participant';
export const TrackGraduation = (props) => {
  const cohort = props?.participant?.cohort;
  const [showEditModel, setShowEditModal] = useState(false);
  return (
    <>
      <Grid container>
        <Grid item xs={4}>
          <Typography>Cohort start date</Typography>
          <Typography>{moment(cohort?.start_date).format('DD MMM YYYY')}</Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography>Cohort end date</Typography>
          <Typography>{moment(cohort?.end_date).format('DD MMM YYYY')}</Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography>Graduation status</Typography>
          <Typography>{props?.participant?.postHireStatusLabel || 'N/A'}</Typography>
          <Grid item xs={6}>
            <Button
              color='default'
              variant='contained'
              text='Update status'
              onClick={() => {
                setShowEditModal(true);
              }}
            />
          </Grid>
        </Grid>
      </Grid>
      <>
        {showEditModel && props?.participant && (
          <Dialog title={'Graduation Status'} open={showEditModel}>
            <ManageGraduationForm
              initialValues={{
                status:
                  props?.participant?.postHireStatus?.status ||
                  'post_secondary_education_completed',
                data: {
                  graduationDate: '',
                },
              }}
              onClose={() => {
                setShowEditModal(false);
              }}
              onSubmit={async (values) => {
                const payload = {
                  participantId: props?.participant.id,
                  status: values.status,
                  data:
                    values.status === 'post_secondary_education_completed'
                      ? {
                          graduationDate: values.data.graduationDate,
                        }
                      : undefined,
                };
                await createPostHireStatus(payload);
                setShowEditModal(false);
              }}
            />
          </Dialog>
        )}
      </>
    </>
  );
};
