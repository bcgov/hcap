export const checkPermissions = (roles, permittedRoles) => {
  return roles.includes('superuser') || roles.some((i) => permittedRoles.includes(i));
}
