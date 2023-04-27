import { Role } from '../constants';

export const checkPermissions = (roles, permittedRoles) => {
  return roles.includes(Role.Superuser) || roles.some((i) => permittedRoles.includes(i));
};

export const checkPending = (roles) => {
  return roles.length === 1 && roles[0] === Role.Employer;
};
