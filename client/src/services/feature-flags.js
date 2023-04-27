import store from 'store';

export const flagKeys = {
  FEATURE_KEYCLOAK_MIGRATION: 'FEATURE_KEYCLOAK_MIGRATION',
};

export const featureFlag = (featureKey) => {
  // Values come from the API as booleans, no need to check for === 'true'
  return store.get(featureKey);
};

export const FeatureFlaggedComponent = ({ featureKey, children }) => {
  if (featureFlag(featureKey)) {
    return children;
  }

  return null;
};
