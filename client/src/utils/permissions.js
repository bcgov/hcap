export const checkPermissions = (roles, permittedRoles) => {
  return roles.includes('superuser') || roles.some((i) => permittedRoles.includes(i));
};

export const checkPending = (roles) => {
  return roles.length === 1 && roles[0] === 'pending';
};
