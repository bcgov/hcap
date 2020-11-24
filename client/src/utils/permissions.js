export const checkPermissions = (roles, permittedRoles) => {
  return roles.includes('superuser') || roles.some((i) => permittedRoles.includes(i));
}

export const checkPending = (roles) => roles.includes('pending');
