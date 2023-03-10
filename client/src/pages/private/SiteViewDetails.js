import React, { lazy, useEffect, useState, useCallback } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import { Box, Chip, Grid, Link, Typography } from '@material-ui/core';

import { Button, Card, Dialog, Page, CheckPermissions } from '../../components/generic';
import { scrollUp } from '../../utils';
import { Routes, MAX_LABEL_LENGTH } from '../../constants';
import { EditSiteForm } from '../../components/modal-forms';
import { useToast } from '../../hooks';
import { flagKeys, featureFlag } from '../../services';
import { ToastStatus, EditSiteSchema } from '../../constants';
import { SiteDetailTabContext } from '../../providers';
import { fetchSitePhases } from '../../services/phases';
import { fetchSiteParticipants, updateSite, fetchSite } from '../../services/site';
import { addEllipsisMask } from '../../utils';

const SiteViewDetailsTabs = lazy(() => import('./SiteViewDetailsTabs'));

const columnIDs = [
  { id: 'participantId', name: 'ID' },
  { id: 'participantName', name: 'Name' },
  { id: 'hiredDate', name: 'Hire Date' },
  { id: 'startDate', name: 'Start Date' },
  { id: 'nonHCAP', name: 'Position' },
  { id: 'archive', name: 'Archive' },
  { id: 'withdrawnDate', name: 'Withdrawn Date' },
  { id: 'reason', name: 'Reason' },
];

const useStyles = makeStyles(() => ({
  cardRoot: {
    minWidth: '1020px',
  },
}));

/**
 * Takes the data from the db and formats it for the table
 * @param {*} response: raw data from API call
 * @returns
 */
const mapSiteParticipantsDataToRow = (response, columnIDs) => {
  return response.map((row) => {
    // Pull all relevant props from row based on columns constant
    const values = {
      participantId: row.participant_id,
      participantName: `${row.participantJoin.body.firstName} ${row.participantJoin.body.lastName}`,
      hiredDate: row.data.hiredDate,
      startDate: row.data.startDate,
      withdrawnDate: row.data.endDate,
      reason: row.data.reason,
      nonHCAP: row.data.nonHcapOpportunity ? 'Non-HCAP' : 'HCAP',
    };

    const mappedRow = columnIDs.reduce(
      (accumulator, column) => ({
        ...accumulator,
        [column.id]: values[column.id],
      }),
      {}
    );
    // Add additional props (user ID, button) to row
    return {
      ...mappedRow,
      id: row.id,
    };
  });
};

export default ({ match }) => {
  const { openToast } = useToast();
  const classes = useStyles();
  const [site, setSite] = useState({});
  const [activeModalForm, setActiveModalForm] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const id = match.params.id;

  const handleSiteEdit = async (site) => {
    const response = await updateSite(site, id);
    setIsLoading(false);
    if (response.ok) {
      setActiveModalForm(null);
      fetchDetails();
    } else {
      openToast({
        status: ToastStatus.Error,
        message: response.error || response.statusText || 'Server error',
      });
    }
  };

  const fetchDetails = useCallback(async () => {
    setHasFetched(true);
    setIsLoading(true);
    const response = await fetchSite(id);
    if (response.ok) {
      const site = await response.json();
      let phases = [];
      if (featureFlag(flagKeys.FEATURE_PHASE_ALLOCATION)) {
        phases = await fetchSitePhases(site.id);
      }
      const participants = await fetchSiteParticipants(columnIDs, site.siteId);
      const { hired, withdrawn } = await participants.json();
      const hiredParticipants = mapSiteParticipantsDataToRow(hired, columnIDs);
      const withdrawnParticipants = mapSiteParticipantsDataToRow(withdrawn, columnIDs);
      setIsLoading(false);
      return setSite({
        ...site,
        hiredParticipants,
        withdrawnParticipants,
        phases,
      });
    } else {
      openToast({
        status: ToastStatus.Error,
        message: response.error || response.statusText || 'Server error',
      });
      setIsLoading(false);
      return setSite({});
    }
  }, [id, setSite, openToast, setIsLoading]);

  useEffect(() => {
    if (!hasFetched) fetchDetails();
  }, [hasFetched, fetchDetails]);

  const defaultOnClose = () => {
    setActiveModalForm(null);
  };

  scrollUp();
  return (
    <>
      <Dialog
        title={`Edit Site (${addEllipsisMask(site.siteName, MAX_LABEL_LENGTH)})`}
        open={activeModalForm != null}
        onClose={defaultOnClose}
      >
        {activeModalForm === 'edit-site' && (
          <EditSiteForm
            initialValues={{
              siteContactFirstName: site.siteContactFirstName,
              siteContactLastName: site.siteContactLastName,
              siteContactPhone: site.siteContactPhone,
              siteContactEmail: site.siteContactEmail,
              siteName: site.siteName,
              registeredBusinessName: site.registeredBusinessName,
              address: site.address,
              city: site.city,
              isRHO: site.isRHO,
              postalCode: site.postalCode,
              operatorName: site.operatorName,
              operatorContactFirstName: site.operatorContactFirstName,
              operatorContactLastName: site.operatorContactLastName,
              operatorPhone: site.operatorPhone,
              operatorEmail: site.operatorEmail,
            }}
            validationSchema={EditSiteSchema}
            isLoading={isLoading}
            onSubmit={(values) => {
              setIsLoading(true);
              const history = {
                timestamp: new Date(),
                changes: [],
              };
              Object.keys(values).forEach((key) => {
                if (values[key] !== site[key]) {
                  history.changes.push({
                    field: key,
                    from: site[key],
                    to: values[key],
                  });
                }
              });
              handleSiteEdit({
                siteContactFirstName: values.siteContactFirstName,
                siteContactLastName: values.siteContactLastName,
                siteContactPhone: values.siteContactPhone,
                siteContactEmail: values.siteContactEmail,
                siteName: values.siteName,
                registeredBusinessName: values.registeredBusinessName,
                address: values.address,
                city: values.city,
                isRHO: values.isRHO,
                postalCode: values.postalCode,
                operatorName: values.operatorName,
                operatorContactFirstName: values.operatorContactFirstName,
                operatorContactLastName: values.operatorContactLastName,
                operatorPhone: values.operatorPhone,
                operatorEmail: values.operatorEmail,
                history: site.history ? [history, ...site.history] : [history],
              });
            }}
            onClose={defaultOnClose}
          />
        )}
      </Dialog>
      <Page>
        <CheckPermissions
          permittedRoles={['health_authority', 'ministry_of_health']}
          renderErrorMessage={true}
        >
          <SiteDetailTabContext.TabProvider site={site}>
            <Card className={classes.cardRoot}>
              <Box pt={4} pb={2} pl={4} pr={4}>
                <Box pb={4} pl={2}>
                  <Box pb={2}>
                    <Typography variant='body1'>
                      <Link href={Routes.SiteView}>View Sites</Link> /{' '}
                      {addEllipsisMask(site.siteName, MAX_LABEL_LENGTH)}
                    </Typography>
                  </Box>
                  <Grid container>
                    <Typography variant='h2'>
                      <b>{site.siteName}</b>
                    </Typography>
                    <CheckPermissions permittedRoles={['ministry_of_health']}>
                      <Box pl={2} pt={0.5}>
                        <Button
                          onClick={async () => {
                            setActiveModalForm('edit-site');
                          }}
                          variant='outlined'
                          fullWidth={false}
                          size='small'
                          text='Edit'
                        />
                      </Box>
                    </CheckPermissions>
                  </Grid>
                  {site.isRHO ? (
                    <Box pt={1}>
                      <Chip size='small' color='primary' label='Regional Health Authority' />
                    </Box>
                  ) : null}
                </Box>
              </Box>
              <SiteViewDetailsTabs
                id={id}
                siteId={site.siteId}
                fetchDetails={fetchDetails}
                isLoading={isLoading}
              />
            </Card>
          </SiteDetailTabContext.TabProvider>
        </CheckPermissions>
      </Page>
    </>
  );
};
