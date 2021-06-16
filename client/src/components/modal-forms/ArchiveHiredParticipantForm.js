import React from 'react';
import { Box } from '@material-ui/core';
import Grid from '@material-ui/core/Grid';
import { Button } from '../generic';
import { Field,  Formik, Form as FormikForm } from 'formik';
import { RenderSelectField ,RenderDateField, RenderCheckbox} from '../fields';
import { archiveReasonOptopns, archiveStatusOptions } from '../../constants';

const statusOptions = archiveStatusOptions.map((option)=>({value:option,label:option}));
const reasonOptions = archiveReasonOptopns.map((option)=>({value:option,label:option}));
const typeOptions = [{value:"",label:""},{value:"employmentEnded",label:"Employment ended"},{value:"duplicate",label:"Duplicate"}]
export const ArchiveHiredParticipantForm = ({ initialValues, validationSchema, onSubmit, onClose }) => {
  return (
      <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
          {(props)=>(
          <FormikForm>
            <Field name = 'type' component={RenderSelectField} options = {typeOptions} label= "Type"/>
            {props.values.type === "employmentEnded" && (
            <>
              <Field name = 'endDate' component={RenderDateField} label='End Date'/>
              <Field name = 'reason' component={RenderSelectField}  options = {reasonOptions} label = 'Reason'/>
              <Field name = 'status' component={RenderSelectField}  options = {statusOptions} label = 'Status'/>
            </>)}
            <Field name = 'confirmed' component= {RenderCheckbox} label='I awknowledge that the information above is correct and that archiving this participant is irreversible.' />
            <Box mt={3}>
                <Grid container spacing={2} justify='flex-end'>
                  <Grid item>
                    <Button onClick={onClose} color='default' text='Cancel' />
                  </Grid>
                  <Grid item>
                    <Button onClick={props.submitForm} variant='contained' color='primary' text='Submit' />
                  </Grid>
                </Grid>
              </Box>
          </FormikForm>)
          }
      </Formik>
    );
  };