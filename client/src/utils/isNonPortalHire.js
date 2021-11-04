/**
 * Determines whether a PEOI is a non-portal hire.
 * We don't have a strict field to check for non-portal hire, so we check if form version exists which is only set for portal submissions
 *
 * @param {Object} peoi - The PEOI to check.
 * @returns {boolean} True if the PEOI is a non-portal hire.
 */
export const isNonPortalHire = (peoi) => {
  return !peoi.formVersion;
};
