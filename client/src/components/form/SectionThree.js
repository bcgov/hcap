import React, { useEffect, useRef, Fragment } from 'react';
import Alert from '@material-ui/lab/Alert';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { FastField, useFormikContext } from 'formik';

import { getVersionCopy } from '../../utils';

import { Card } from '../generic';
import { RenderCheckbox, RenderRadioGroup, } from '../fields';

export const SectionThree = ({ isDisabled }) => {
  const { values, setFieldValue } = useFormikContext();
  const { bedroomAccommodation, version } = values;
  const firstMount = useRef(true);

  useEffect(() => {
    if (!isDisabled && !firstMount.current) {
      setFieldValue('areBedsInRightConfiguration', false);
    }
    firstMount.current = false;
  }, [bedroomAccommodation]);

  return (
    <Card noPadding={isDisabled} noShadow={isDisabled}>
      <Grid container spacing={3}>

        {/** First Block */}
        {!isDisabled && (
          <Grid item xs={12}>
            <Typography variant="subtitle1">
              Before workers arrive at your farm, please certify
            </Typography>
            <Box mt={3} mb={1}>
              <Alert severity="warning">
                <Typography variant="body2" gutterBottom>
                  <b>
                    All tasks in this form (checked or left blank) will be subject to inspection.
                  </b>
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <b>
                    If you have not completed a task, you will need to show your inspector your plan
                    to complete it before your workers arrive.
                  </b>
                </Typography>
              </Alert>
            </Box>
          </Grid>
        )}

        {/** Second Block */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" paragraph>
            Be COVID-19 Aware
          </Typography>
          {!isDisabled && (
            <Typography variant="body1" paragraph>
              Farm operators need to make all farm workers aware of the risks of COVID-19 and be prepared
              if workers have questions about COVID-19.
            </Typography>
          )}
          <FastField
            name="hasSignage"
            component={RenderCheckbox}
            label="I have signage in place in the appropriate language on how workers can protect themselves from COVID-19."
            disabled={isDisabled}
          />
          <FastField
            name="hasSomeoneIdentified"
            component={RenderCheckbox}
            label="I have someone identified that workers can go to if they have questions on COVID-19."
            disabled={isDisabled}
          />
          <FastField
            name="hasContactedLocalMedicalHealthOfficer"
            component={RenderCheckbox}
            disabled={isDisabled}
            label={getVersionCopy(version, 'hasContactedLocalMedicalHealthOfficer')}
          />
        </Grid>

        {/** Third Block */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" paragraph>
            Provide safe lodging and accommodation for all workers
          </Typography>
          {!isDisabled && (
            <Typography variant="body1" gutterBottom>
              Farm operators must be able to provide accommodations that minimize crowding, social interactions,
              and provide sufficient physical distance (beds 2m apart and head-to-toe in shared accommodations).
            </Typography>
          )}
          <FastField
            name="doCommonAreasAllowPhysicalDistancing"
            component={RenderCheckbox}
            label="Common areas allow physical distancing of 2m / 6ft at all times."
            disabled={isDisabled}
          />
          <Box mt={1}>
            <FastField
              name="bedroomAccommodation"
              component={RenderRadioGroup}
              label="Do you have:"
              disabled={isDisabled}
              options={[
                { value: 'single', label: 'Single occupancy bedrooms' },
                { value: 'shared', label: 'Shared occupancy bedrooms' },
                { value: 'both', label: 'Both' },
              ]}
              hiddenCheckbox={{
                fields: ['shared', 'both'],
                node: (
                  <Box ml={2.5}>
                    <FastField
                      name="areBedsInRightConfiguration"
                      component={RenderCheckbox}
                      label="Beds in the right configuration with the right distance apart."
                      disabled={isDisabled}
                    />
                  </Box>
                ),
              }}
            />
          </Box>
        </Grid>

        {/** Fourth Block */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" paragraph>
            Provide self-isolation space if any worker comes down with COVID-19-like symptoms
          </Typography>
          {!isDisabled && (
            <Typography variant="body1" gutterBottom>
              Self-isolation of any worker that becomes ill is a critical part of preventing the spread of COVID-19.
            </Typography>
          )}
          <FastField
            name="doesUnderstandNeedsForSelfIsolation"
            component={RenderCheckbox}
            label="I understand what is needed for a person to self-isolate."
            disabled={isDisabled}
          />
          <FastField
            name="hasSeparateAccommodationForWorker"
            component={RenderCheckbox}
            label="I have separate accommodation to let a worker self-isolate away from other workers or have arranged for separate accommodation."
            disabled={isDisabled}
          />
        </Grid>

        {/** Fifth Block */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" paragraph>
            Make sure laundry facilities are available and handled safely
          </Typography>
          {!isDisabled && (
            <Typography variant="body1" gutterBottom>
              Laundry must be performed properly to prevent the spread and transmission of COVID-19, including using
              hot water for laundry machines and having adequate supply of detergent.
            </Typography>
          )}
          <FastField
            name="hasLaundryServices"
            component={RenderCheckbox}
            label="I have laundry services available for regular use."
            disabled={isDisabled}
          />
        </Grid>

        {/** Sixth Block */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" paragraph>
            Practice good waste management at your work site and housing
          </Typography>
          {!isDisabled && (
            <Typography variant="body1" gutterBottom>
              Proper collection and removal of garbage is crucial to reducing the risk of disease transmission.
              This includes wearing disposable gloves to remove waste from rooms and common areas and using sturdy,
              leak resistant garbage bags for containing waste.
            </Typography>
          )}
          <FastField
            name="hasDisposableGloves"
            component={RenderCheckbox}
            label="I have disposable gloves for the handling of garbage or there is access to hand hygiene facilities either through hand hygiene stations or the provisions of hand sanitizer."
            disabled={isDisabled}
          />
          <FastField
            name="hasWasteRemovalSchedule"
            component={RenderCheckbox}
            label="I have a waste removal schedule."
            disabled={isDisabled}
          />
          <FastField
            name="hasSturdyLeakResistantGarbageBags"
            component={RenderCheckbox}
            label="I have sturdy, leak resistant garbage bags."
            disabled={isDisabled}
          />
        </Grid>

        {/** Seventh Block */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" paragraph>
            Have proper hand-washing facilities at your work site and housing
          </Typography>
          {!isDisabled && (
            <Typography variant="body1" gutterBottom>
              Helping workers to engage in hand hygiene prevents or reduces the spread of COVID-19 and
              other illnesses. Farm operators should ensure easy access to hand hygiene facilities either
              through hand hygiene stations or the provisions of hand sanitizer.
            </Typography>
          )}
          <FastField
            name="hasHandWashingSinks"
            component={RenderCheckbox}
            label="I have an adequate number of hand washing sinks available to workers."
            disabled={isDisabled}
          />
          <FastField
            name="hasAppropriateSupplyOfSinkWater"
            component={RenderCheckbox}
            label="There is an appropriate supply of warm water for all sinks."
            disabled={isDisabled}
          />
          <FastField
            name="hasPlainSoap"
            component={RenderCheckbox}
            label="I have provided plain soap."
            disabled={isDisabled}
          />
          <FastField
            name="hasPaperTowels"
            component={RenderCheckbox}
            label="I have provided disposable paper towels."
            disabled={isDisabled}
          />
          <FastField
            name="hasHandWashingSigns"
            component={RenderCheckbox}
            label="I have put up signs to promote regular hand washing."
            disabled={isDisabled}
          />
        </Grid>

        {/** Eighth Block */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" paragraph>
            Create and maintain physical distancing barriers
          </Typography>
          {!isDisabled && (
            <Fragment>
              <Typography variant="body1" paragraph>
                Keeping a 2 metre distance between people is one of the most important ways to break the chain of
                transmission of COVID-19.  Farm operators can take practical steps to ensure physical distancing
                is maintained while workers are transported to or from the work site, while working indoors or
                outdoors, during break times.
              </Typography>
              <Typography variant="body1" gutterBottom>
                Physical barriers such as the use of plexi-glass, face shields, masks, and other techniques can
                be used where physical distancing is not possible.
              </Typography>
            </Fragment>
          )}
          <FastField
            name="hasSleepingArrangements"
            component={RenderCheckbox}
            label="I have sleeping arrangements that maintains physical distancing or uses physical barriers."
            disabled={isDisabled}
          />
          <FastField
            name="hasPhysicalBarriers"
            component={RenderCheckbox}
            label="I have physical barriers like face shields or masks for situations where physical distancing is not possible."
            disabled={isDisabled}
          />
        </Grid>

        {/** Ninth Block */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" paragraph>
            Have a cleaning and disinfecting schedule
          </Typography>
          {!isDisabled && (
            <Typography variant="body1" gutterBottom>
              All common areas and surfaces should be cleaned at the start and end of each day. Examples of common
              areas and surfaces include washrooms, common tables, desks, light switches, and door handles. Regular
              household cleaners are effective against COVID-19, following the instructions on the label.
            </Typography>
          )}
          <FastField
            name="hasScheduleToEnsureTouchAreasAreCleaned"
            component={RenderCheckbox}
            label="I have a schedule to ensure common and high touch areas are cleaned or disinfected at the start and end of each day."
            disabled={isDisabled}
          />
        </Grid>
      </Grid>
    </Card>
  );
};
