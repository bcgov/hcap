const strToBoolean = (value) => value === 'true';

export const FEATURE_KEYCLOAK_MIGRATION = strToBoolean(process.env.FEATURE_KEYCLOAK_MIGRATION);
export const FEATURE_EMPLOYER_FORM = false;
