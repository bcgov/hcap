const regionsMap = [
  { role: 'region_fraser', region: 'Fraser' },
  { role: 'region_interior', region: 'Interior' },
  { role: 'region_northern', region: 'Northern' },
  { role: 'region_vancouver_coastal', region: 'Vancouver Coastal' },
  { role: 'region_vancouver_island', region: 'Vancouver Island' },
];

const getUserRoles = (req) => {
  const { roles } = req.kauth
    .grant.access_token.content
    .resource_access[process.env.KEYCLOAK_API_CLIENTID];
  return roles;
};

const getUserRegions = (req) => {
  const roles = getUserRoles(req);
  const userRegionRoles = roles.filter((item) => item.includes('region_'));
  return userRegionRoles.map((role) => {
    const regionMap = regionsMap.find((item) => item.role === role);
    return regionMap.region;
  });
};

const getUserRegionsCriteria = (req, field) => {
  const userRegions = getUserRegions(req);
  if (userRegions.length === 0) return null;
  return {
    or: userRegions.map((region) => ({ [`${field} ilike`]: `%${region}%` })),
  };
};

module.exports = {
  getUserRoles,
  getUserRegions,
  getUserRegionsCriteria,
};
