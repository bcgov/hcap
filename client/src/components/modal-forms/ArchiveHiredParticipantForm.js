import React from 'react';
import { Box } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import { Button } from '../generic';
import { Field,  Formik, Form as FormikForm } from 'formik';
import { RenderSelectField ,RenderDateField} from '../fields';
import { archiveReasonOptopns, archiveStatusOptions } from '../../constants';

const statusOptions = archiveStatusOptions.map((option)=>({value:option,label:option}));
const reasonOptions = archiveReasonOptopns.map((option)=>({value:option,label:option}));
export const ArchiveHiredParticipantForm = ({ initialValues, validationSchema, onSubmit, onClose }) => {

  return (
      <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
          
          {(props)=>(
          <FormikForm>
            <Field name = 'endDate' component={RenderDateField} label='End Date'/>
            <Field name = 'reason' component={RenderSelectField}  options = {reasonOptions} label = 'Reason'/>
            <Field name = 'status' component={RenderSelectField}  options = {statusOptions} label = 'Status'/>

            <Box mt={3}>
              <Grid container spacing={2} justify='flex-end'>
                <Grid item>
                  <Button onClick={onClose} color='default' text='Cancel' />
                </Grid>
                <Grid item>
                  <Button onClick={onSubmit} variant='contained' color='primary' text='Submit' />
                </Grid>
              </Grid>
            </Box>
          </FormikForm>
          )}
      </Formik>
    );
  };