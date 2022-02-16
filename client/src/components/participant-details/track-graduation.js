import { Grid, Typography, Dialog } from '@material-ui/core';
import { Button } from '../../components/generic/Button';

import { ManageGraduationForm } from '../modal-forms/ManageGraduationForm';
import { AssignCohortForm } from '../modal-forms/AssignCohort';
import React, { useEffect, useState } from 'react';
import moment from 'moment';
import { createPostHireStatus } from '../../services/participant';
export const TrackGraduation = (props) => {
  const [cohort, setCohort] = useState(null);
  const { fetchData } = props;
  const [showEditModel, setShowEditModal] = useState(false);

  useEffect(() => {
    setCohort(props.participant?.cohort);
  }, [setCohort, props.participant?.cohort]);
  return (
    <>
      <Grid container>
        <Grid item xs={4}>
          <Typography>Cohort start date</Typography>
          <Typography>
            {cohort?.start_date ? moment(cohort.start_date).format('MMM DD, YYYY') : 'N/A'}
          </Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography>Cohort end date</Typography>
          <Typography>
            {cohort?.end_date ? moment(cohort.end_date).format('MMM DD, YYYY') : 'N/A'}
          </Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography>Graduation status</Typography>
          <Typography>{props?.participant?.postHireStatusLabel || 'N/A'}</Typography>
          <Grid item xs={8}>
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
        {showEditModel && cohort?.id && (
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
                      : {},
                };
                await createPostHireStatus(payload);
                setShowEditModal(false);
                fetchData();
              }}
            />
          </Dialog>
        )}
      </>
      <>
        {' '}
        {showEditModel && !cohort?.id && (
          <Dialog title='Assign Cohort' open={showEditModel}>
            <AssignCohortForm
              initialValues={{}}
              participantId={props?.participant.id}
              onClose={() => setShowEditModal(false)}
              onSubmit={async (cohort) => {
                await fetchData();
              }}
            />
          </Dialog>
        )}
      </>
    </>
  );
};
