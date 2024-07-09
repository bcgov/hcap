/**
 * @method callEventSelectPathway
 * @description This is a snowplow event selector to track when user submits the survey.
 * @param text defines the selected pathway after successful submission
 */
export const snowplowCallEventSelectPathway = (text) => {
  // call snowplow to track the event
  window.snowplow('trackSelfDescribingEvent', {
    schema: 'iglu:ca.bc.gov.hcap/action/jsonschema/1-0-0',
    data: {
      action: 'select_pathway',
      text,
    },
  });
};
