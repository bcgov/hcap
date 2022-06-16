import { Grid, Typography, Dialog, Box } from '@material-ui/core';
import { Button } from '../../components/generic/Button';
import { ArchiveHiredParticipantForm } from '../../components/modal-forms';
import store from 'store';
import { ManageGraduationForm } from '../modal-forms/ManageGraduationForm';
import { AssignCohortForm } from '../modal-forms/AssignCohort';
import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { createPostHireStatus } from '../../services/participant';
import { fetchUserNotifications } from '../../services';
import { ToastStatus, API_URL, ArchiveHiredParticipantSchema } from '../../constants';
import { postHireStatuses } from '../../constants';
import { AuthContext } from '../../providers';
import { useToast } from '../../hooks';
import { formatCohortDate } from '../../utils';
// Helper function to call archive participant service
const handleArchive = async (participantId, openToast, dispatchFunction, additional = {}) => {
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
    fetchUserNotifications(dispatchFunction);

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
  const { dispatch } = AuthContext.useAuth();
  const [cohort, setCohort] = useState(null);
  const { fetchData } = props;
  const [showEditModel, setShowEditModal] = useState(false);
  const [showArchiveModel, setShowArchiveModal] = useState(false);
  const { openToast } = useToast();
  const disableTrackGraduation =
    props.participant?.postHireStatus?.status === postHireStatuses.postSecondaryEducationCompleted;

  const cohortEndDate = props.participant?.cohort
    ? formatCohortDate(props.participant.cohort.end_date, { isForm: true })
    : null;

  const dispatchFunction = (notifications) =>
    dispatch({ type: AuthContext.USER_NOTIFICATIONS_UPDATED, payload: notifications });

  useEffect(() => {
    setCohort(props.participant?.cohort);
  }, [setCohort, props.participant?.cohort]);
  return (
    <>
      <Grid container>
        <Grid item xs={4}>
          <Typography variant='body1'>
            <b>Cohort start date</b>
          </Typography>
          <Typography variant='body1'>
            {cohort?.start_date ? formatCohortDate(cohort.start_date) : 'N/A'}
          </Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography variant='body1'>
            <b>Cohort end date</b>
          </Typography>
          <Typography variant='body1'>
            {cohort?.end_date ? formatCohortDate(cohort.end_date) : 'N/A'}
          </Typography>
        </Grid>
        <Grid item xs={4}>
          <Typography variant='subtitle2'>Graduation Status</Typography>
          <Box my={1}>
            <Typography variant='body1'>
              {props?.participant?.postHireStatusLabel || 'N/A'}
            </Typography>
          </Box>
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
                        },
                };
                try {
                  await createPostHireStatus(payload);
                  setShowEditModal(false);
                  openToast({
                    status: ToastStatus.Info,
                    message: 'Participant status updated',
                  });
                  if (values.continue === 'continue_no') {
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
        {showArchiveModel && (
          <Dialog title='Archive Participant' open={showArchiveModel}>
            <Box p={4}>
              <Typography color='primary' variant='subtitle1'>
                Archive Participant
              </Typography>
              <hr />
              <ArchiveHiredParticipantForm
                initialValues={{
                  type: '',
                  reason: '',
                  status: '',
                  endDate: dayjs().format('YYYY/MM/DD'),
                  rehire: '',
                  confirmed: false,
                }}
                validationSchema={ArchiveHiredParticipantSchema}
                onClose={() => {
                  setShowArchiveModal(false);
                }}
                onSubmit={async (values) => {
                  setShowArchiveModal(false);
                  await handleArchive(props?.participant?.id, openToast, dispatchFunction, values);
                  fetchData();
                }}
                participant={props?.participant}
              />
            </Box>
          </Dialog>
        )}
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
