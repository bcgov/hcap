import React from 'react';
import Link from '@material-ui/core/Link';

const CURRENT_VERSION = 2;

/**
 * Map the copy of particular fields to their respected version.
 *
 * @param {Number} version - The copy version. *IMPORTANT* Must default to the latest version.
 * @param {String} fieldName - The name of the input field.
 * @returns {JSX.Element} The field's respected label.
 */
export const getVersionCopy = (version = CURRENT_VERSION, fieldName) => {
  switch (fieldName) {
    case 'hasContactedLocalMedicalHealthOfficer': {
      return {
        1: 'I have contacted my local Medical Health Officer to alert them to the arrival of temporary foreign workers to the region.',
        2: (
          <span>
            I have contacted my local&nbsp;
            <Link
              href="https://www2.gov.bc.ca/gov/content/health/keeping-bc-healthy-safe/industrial-camps"
              rel="noreferrer noopenner"
              target="_blank"
            >
              Health Authority
            </Link>
            &nbsp;to alert them to the arrival of temporary foreign workers to the region.
          </span>
        ),
      }[version];
    }
    default:
      return null;
  }
};

/**
 * Map determination values to view names.
 *
 * @param {Object} determination - The determination values.
 * @returns {Object} The view name.
 */
export const mapDetermination = (determination) => {
  switch (determination) {
    case 'followup':
      return {
        buttonText: 'Follow-up Required',
        listViewText: 'Follow-up',
      };
    case 'passed':
      return {
        buttonText: 'Passed Inspection',
        listViewText: 'Passed',
      };
    case 'failed':
      return {
        buttonText: 'Failed Inspection',
        listViewText: 'Failed',
      };
    default:
      return {
        buttonText: null,
        listViewText: 'Submitted',
      };
  }
};

/**
 * Intended to modify form values before submitting to the backend.
 *
 * @param {Object} submission - The form values.
 * @returns {Object} The modified object.
 */
export const handleSubmission = (submission) => {
  const modified = { ...submission };
  delete modified.numberOfAdditionalAddresses;
  modified.version = CURRENT_VERSION;
  return modified;
};

/**
 * Intended to adapt old, invalid versions of the form to display (mostly) correctly
 * Could remap field names, handle unexpected data types, etc. if migrations have not
 * yet been run against DB.
 *
 * @param {Object} submission - The form values.
 * @returns {Object} The modified object.
 */
export const adaptSubmission = (submission) => {
  const modified = { ...submission };
  if (submission.isSameAsBusinessAddress === false
    && typeof submission.numberOfAdditionalAddresses === 'undefined'
    && Array.isArray(submission.temporaryForeignWorkerFacilityAddresses)) {
    modified.numberOfAdditionalAddresses = submission.temporaryForeignWorkerFacilityAddresses.length;
  }
  return modified;
};
