import { HcapUserInfo } from '../../keycloak';

/**
 * Check whether user has a Private Employer, MHSU Employer or Health Authority role
 * @param user current user
 * @returns boolean
 */
export const isPrivateEmployerOrMHSUEmployerOrHA = (user: HcapUserInfo) =>
  user.isEmployer || user.isMHSUEmployer || user.isHA;
