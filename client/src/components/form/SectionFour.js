import React, { Fragment } from 'react';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { FastField } from 'formik';

import { Card } from '../generic';
import { RenderCheckbox } from '../fields';

export const SectionFour = ({ isDisabled }) => {
  return (
    <Card noPadding={isDisabled} noShadow={isDisabled}>
      <Grid container spacing={3}>

        {/** First Block */}
        {!isDisabled && (
          <Grid item xs={12}>
            <Typography variant="subtitle1" paragraph>
              After temporary foreign workers arrive at the farm
            </Typography>
            <Typography variant="body1" paragraph>
              Once your temporary foreign workers arrive at the farm, you are expected to continue your work
              following your infection prevention and control protocol and minimize the risk of transmission of
              COVID-19 through these key activities.
            </Typography>
          </Grid>
        )}

        {/** Second Block */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" paragraph>
            Train workers on COVID-19 infection control
          </Typography>
          {!isDisabled && (
            <Typography variant="body1" paragraph>
              Farm operators must provide workers with training in their language about the risk of COVID-19,
              safe work practices, and how to report symptoms.
            </Typography>
          )}
          <FastField
            name="hasMaterialsOnRiskOfExposure"
            component={RenderCheckbox}
            label="I have materials ready on the risk of exposure of COVID-19 and the signs and symptoms of the disease."
            disabled={isDisabled}
          />
          <FastField
            name="hasMaterialsOnHandWashingPhysicalDistancingCoughSneeze"
            component={RenderCheckbox}
            label="I have materials ready on hand washing, physical distancing, and cough/sneeze etiquette."
            disabled={isDisabled}
          />
          <FastField
            name="hasMaterialsOnHandWashingFacilities"
            component={RenderCheckbox}
            label="I can provide locations of hand washing facilities, including dispensing stations for alcohol-based hand rubs."
            disabled={isDisabled}
          />
          <FastField
            name="hasMaterialsReadyOnHowToSeekFirstAid"
            component={RenderCheckbox}
            label="I have materials ready on how to seek first aid."
            disabled={isDisabled}
          />
          <FastField
            name="hasMaterialsReadyOnHowToReportExposure"
            component={RenderCheckbox}
            label="I have materials ready on how to report an exposure to or symptoms of COVID-19."
            disabled={isDisabled}
          />
        </Grid>

        {/** Third Block */}
        <Grid item xs={12}>
          <Typography variant="subtitle2" paragraph>
            Prepare meals and practice safe food handling
          </Typography>
          {!isDisabled && (
            <Fragment>
              <Typography variant="body1" gutterBottom>
                All farm operators and workers must practice good food handling and hygiene practices.
              </Typography>
              <Typography variant="body1" gutterBottom>
                This includes safe food practices like protecting foods from contamination, minimizing direct handling
                of food and preventing cross contamination of foods.
              </Typography>
            </Fragment>
          )}
          <FastField
            name="hasSchedulesForKitchenEatingAreas"
            component={RenderCheckbox}
            label="I have schedules in place for kitchen/eating areas to limit contact and maintain 2 metre physical distancing."
            disabled={isDisabled}
          />
          <FastField
            name="doWorkersHaveOwnDishware"
            component={RenderCheckbox}
            label="Each worker has their own dishware, utensils and drinking cup or provided disposable alternatives."
            disabled={isDisabled}
          />
          <FastField
            name="isDishwareWashedImmediately"
            component={RenderCheckbox}
            label="Used dishware will be washed immediately."
            disabled={isDisabled}
          />
        </Grid>
      </Grid>
    </Card>
  );
};
