/**
 * Validation layer to see if the user has access to requested health region
 * @param user data of a user who accesses the endpoints
 * @param regionId health region
 * @return true if the user has access
 */
export const checkUserRegion = (user, regionId: string): boolean =>
  user && user.regions?.includes(regionId);
