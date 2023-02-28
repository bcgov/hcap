import * as yup from 'yup';
import { validateDateIsReasonable, errorMessage, errorDateIsReasonable } from '../functions';

export const CreatePhaseSchema = yup.object().shape({
  phaseName: yup
    .string()
    .required('Phase name is required')
    .max(255, 'Phase name should be no longer than 255 characters'),
  startDate: yup
    .date()
    .required(errorMessage)
    .typeError(errorMessage)
    .test('is-reasonable', errorDateIsReasonable, validateDateIsReasonable),
  endDate: yup
    .date()
    .when('startDate', (startDate, schema) => {
      if (startDate) {
        return schema.test({
          test: (endDate) =>
            new Date(new Date(startDate).getTime() + 86400000) <= new Date(endDate),
          message: 'Invalid entry. End date must be at least 1 day after Start date',
        });
      } else {
        return schema;
      }
    })
    .required(errorMessage)
    .typeError(errorMessage)
    .test('is-reasonable', errorDateIsReasonable, validateDateIsReasonable),
  phases: yup
    .array()
    .of(
      yup.object().shape({
        name: yup.string(),
        end_date: yup.date(),
        start_date: yup.date(),
        id: yup.string(),
      })
    )
    .when(['startDate', 'endDate'], (startDate, endDate, schema) => {
      if (startDate && endDate) {
        return schema.test({
          name: 'validate-date-overlap',
          test: function (value) {
            const overlappingPhaseIds = value
              .filter((phase) => {
                const phaseStartDate = Date.parse(phase.start_date);
                const phaseEndDate = Date.parse(phase.end_date);
                const formStartDate = Date.parse(startDate);
                const formEndDate = Date.parse(endDate);
                const startDateExistsWithin =
                  formStartDate >= phaseStartDate && formStartDate <= phaseEndDate;
                const endDateExistsWithin =
                  formEndDate >= phaseStartDate && formEndDate <= phaseEndDate;
                const overlaps = formStartDate <= phaseStartDate && formEndDate >= phaseEndDate;

                if (startDateExistsWithin || endDateExistsWithin || overlaps) {
                  return phase;
                }
              })
              .map(({ id }) => Number(id));

            console.log('in validator', value);
            return overlappingPhaseIds.length > 0
              ? // this.createError expects a message as string, for this use case the UI needs dynamic data.
                // returning the Ids as a string, and converting to an array of Ids in the component.
                this.createError({
                  message: overlappingPhaseIds.toString(),
                  path: 'phases',
                })
              : true;
          },
        });
      } else {
        return schema;
      }
    }),
});
