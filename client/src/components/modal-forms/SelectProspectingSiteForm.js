import React, { useMemo, useState } from 'react';
import _orderBy from 'lodash/orderBy';
import { AuthContext } from '../../providers';

import {
  Box,
  Collapse,
  Divider,
  Typography,
  Link,
  List,
  ListItem,
  ListItemText,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { FastField, Formik, Form as FormikForm } from 'formik';

import { RenderSelectField } from '../fields';
import { Button } from '../generic';
import { addEllipsisMask } from '../../utils';

const useStyles = makeStyles((theme) => ({
  formButton: {
    maxWidth: '200px',
  },
  formDivider: {
    marginBottom: theme.spacing(2),
    marginTop: theme.spacing(2),
  },
  formLabel: {
    marginBottom: theme.spacing(1),
    fontWeight: 700,
    color: theme.palette.headerText.secondary,
  },
  collapseList: {
    backgroundColor: theme.palette.background.light,
    borderRadius: '4px',
    maxHeight: '250px',
    overflowY: 'scroll',
  },
}));

export const SelectProspectingSiteForm = ({
  isMultiSelect,
  selected,
  initialValues,
  validationSchema,
  onSubmit,
  onClose,
}) => {
  const { auth } = AuthContext.useAuth();
  const sites = useMemo(() => auth.user?.sites || [], [auth.user?.sites]);
  const classes = useStyles();
  const [areParticipantsVisible, setParticipantsVisible] = useState(false);

  const MAX_LABEL_LENGTH = 50;
  const canSeeMultiSelect = isMultiSelect && selected?.length > 1;

  const showSelectedParticipants = (_event) => {
    setParticipantsVisible(!areParticipantsVisible);
  };

  return (
    <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
      {({ submitForm }) => (
        <FormikForm>
          <Typography className={classes.formLabel} variant='subtitle2'>
            {`Please select the site ${
              canSeeMultiSelect
                ? `for ${selected?.length} participants`
                : 'this participant is prospecting for'
            }`}
          </Typography>
          <FastField
            name='prospectingSite'
            component={RenderSelectField}
            placeholder='Select Site'
            options={_orderBy(sites, ['siteName']).map((item) => ({
              value: item.siteId,
              label: addEllipsisMask(item.siteName, MAX_LABEL_LENGTH),
            }))}
          />

          {canSeeMultiSelect && (
            <Box my={2}>
              <Link
                component='button'
                color='primary'
                type='button'
                variant='subtitle2'
                onClick={showSelectedParticipants}
              >
                {`${areParticipantsVisible ? 'Hide' : 'View'} selected participants`}
              </Link>

              <Collapse in={areParticipantsVisible} timeout='auto' unmountOnExit>
                <Box mt={2} className={classes.collapseList}>
                  <List>
                    {selected.map((participant, index) => (
                      <ListItem key={`p${index}`}>
                        <ListItemText
                          primary={`${participant.id} ${participant.firstName} ${participant.lastName}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Collapse>
            </Box>
          )}

          <Divider className={classes.formDivider} />

          <Box display='flex' justifyContent='space-between'>
            <Button
              className={classes.formButton}
              onClick={onClose}
              variant='outlined'
              text='Cancel'
            />
            <Button
              type='submit'
              className={classes.formButton}
              onClick={submitForm}
              text='Confirm'
            />
          </Box>
        </FormikForm>
      )}
    </Formik>
  );
};
