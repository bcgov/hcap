import { Role } from '../constants';

export const checkPermissions = (roles, permittedRoles, participant) => {
  if (
    (participant?.program === 'HCA' && roles.includes(Role.MHSUEmployer)) ||
    (participant?.program === 'MHAW' && roles.includes(Role.Employer))
  ) {
    return false;
  }
  return roles.includes(Role.Superuser) || roles.some((i) => permittedRoles.includes(i));
};

export const checkPending = (roles) => {
  return roles.length === 1 && roles[0] === Role.Employer;
};
