import React, { useMemo, useState } from 'react';
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
} from '@mui/material';
import { FastField, Formik, Form as FormikForm } from 'formik';

import { RenderSelectField } from '../fields';
import { Button } from '../generic';
import { addEllipsisMask } from '../../utils';
import { MAX_LABEL_LENGTH } from '../../constants';

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
  const [areParticipantsVisible, setParticipantsVisible] = useState(false);

  const canSeeMultiSelect = isMultiSelect && selected?.length > 1;

  const showSelectedParticipants = (_event) => {
    setParticipantsVisible(!areParticipantsVisible);
  };

  return (
    <Formik initialValues={initialValues} validationSchema={validationSchema} onSubmit={onSubmit}>
      {({ submitForm }) => (
        <FormikForm>
          <Typography
            sx={{ mb: 1, fontWeight: 700, color: 'headerText.secondary' }}
            variant='subtitle2'
          >
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
            options={sites.map((item) => ({
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
                <Box
                  mt={2}
                  sx={{
                    backgroundColor: 'background.light',
                    borderRadius: '4px',
                    maxHeight: '250px',
                    overflowY: 'scroll',
                  }}
                >
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

          <Divider sx={{ my: 2 }} />

          <Box display='flex' justifyContent='space-between'>
            <Button sx={{ maxWidth: '200px' }} onClick={onClose} variant='outlined' text='Cancel' />
            <Button type='submit' sx={{ maxWidth: '200px' }} onClick={submitForm} text='Confirm' />
          </Box>
        </FormikForm>
      )}
    </Formik>
  );
};
