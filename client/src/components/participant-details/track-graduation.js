import { Grid, Typography, Dialog, Box } from '@material-ui/core';
import { Button } from '../../components/generic/Button';
import { ArchiveHiredParticipantForm } from '../../components/modal-forms';
import store from 'store';
import { ManageGraduationForm } from '../modal-forms/ManageGraduationForm';
import { AssignCohortForm } from '../modal-forms/AssignCohort';
import React, { useEffect, useState } from 'react';
import moment from 'moment';
import { createPostHireStatus } from '../../services/participant';
import { ToastStatus, API_URL, ArchiveHiredParticipantSchema } from '../../constants';
import { postHireStatuses } from '../../constants';

import { useToast } from '../../hooks';

// Helper function to call archive participant service
const handleArchive = async (participantId, additional = {}, openToast) => {
  const response = await fetch(`${API_URL}/api/v1/employer-actions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${store.get('TOKEN')}`,
      Accept: 'application/json',
      'Content-type': 'application/json',
    },
    body: JSON.stringify({ participantId, status: 'archived', data: additional }),
  });
  if (response.ok) {
    openToast({
      status: ToastStatus.Info,
      message: 'Participant Archived',
    });
  } else {
    openToast({
      status: ToastStatus.Error,
      message: 'Unable to archive participant',
    });
  }
};

export const TrackGraduation = (props) => {
  const [cohort, setCohort] = useState(null);
  const { fetchData } = props;
  const [showEditModel, setShowEditModal] = useState(false);
  const [showArchiveModel, setShowArchiveModal] = useState(false);
  const { openToast } = useToast();
  const disableTrackGraduation =
    props.participant?.postHireStatus?.status === postHireStatuses.postSecondaryEducationCompleted;

  const cohortEndDate = props.participant?.cohort
    ? moment(props.participant.cohort.end_date).format('YYYY/MM/DD')
    : null;

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
          <Typography variant='subtitle2'>Graduation Status</Typography>
          <Typography>{props?.participant?.postHireStatusLabel || 'N/A'}</Typography>
          <Grid item xs={6}>
            <Button
              color='default'
              variant='contained'
              text='Update status'
              disabled={disableTrackGraduation}
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
              cohortEndDate={cohortEndDate}
              initialValues={{
                status:
                  props?.participant?.postHireStatus?.status ||
                  postHireStatuses.postSecondaryEducationCompleted,
                data: {
                  date:
                    props?.participant?.postHireStatus?.status ===
                    postHireStatuses.cohortUnsuccessful
                      ? ''
                      : cohortEndDate,
                },
                continue: 'continue_yes',
                withdraw: false,
              }}
              onClose={() => {
                setShowEditModal(false);
              }}
              onSubmit={async (values) => {
                const payload = {
                  participantId: props?.participant.id,
                  status: values.status,
                  data:
                    values.status === postHireStatuses.postSecondaryEducationCompleted
                      ? {
                          graduationDate: values?.data?.date,
                        }
                      : {
                          unsuccessfulCohortDate: values?.data?.date,
                          continue: values.continue,
                          withdraw: values.withdraw,
                        },
                };
                try {
                  await createPostHireStatus(payload);
                  setShowEditModal(false);
                  openToast({
                    status: ToastStatus.Info,
                    message: 'Participant status updated',
                  });
                  if (values.withdraw && values.continue === 'continue_no') {
                    setShowArchiveModal(true);
                  }
                  fetchData();
                } catch (error) {
                  openToast({
                    status: ToastStatus.Error,
                    message: `${error.message}`,
                  });
                }
              }}
            />
          </Dialog>
        )}
        <Dialog title={'Archive Participant'} open={showArchiveModel}>
          {showArchiveModel && (
            <Box spacing={10} p={5}>
              <Typography color={'primary'} variant={'h4'}>
                Archive Participant
              </Typography>
              <hr />
              <ArchiveHiredParticipantForm
                initialValues={{
                  type: '',
                  reason: '',
                  status: '',
                  endDate: moment().format('YYYY/MM/DD'),
                  rehire: '',
                  confirmed: false,
                }}
                validationSchema={ArchiveHiredParticipantSchema}
                onClose={() => {
                  setShowArchiveModal(false);
                }}
                onSubmit={async (values) => {
                  setShowArchiveModal(false);
                  await handleArchive(props?.participant?.id, values, openToast);
                  fetchData();
                }}
              />
            </Box>
          )}
        </Dialog>
      </>
      <>
        {showEditModel && !cohort?.id && (
          <Dialog title='Assign Cohort' open={showEditModel}>
            <AssignCohortForm
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
