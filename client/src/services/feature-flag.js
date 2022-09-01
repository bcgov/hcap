import store from 'store';

export const flagKeys = {
  FEATURE_PHASE_ALLOCATION: 'FEATURE_PHASE_ALLOCATION',
};

export const featureFlag = (featureKey) => {
  // Values come from the API as booleans, no need to check for === 'true'
  return store.get(featureKey);
};

export const FeatureFlag = ({ featureKey, children }) => {
  if (featureFlag(featureKey)) {
    return children;
  }

  return null;
};
