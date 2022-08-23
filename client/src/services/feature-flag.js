import store from 'store';

export const flagKeys = {
  FEATURE_PHASE_ALLOCATION: 'FEATURE_PHASE_ALLOCATION',
};

export const FeatureFlag = ({ featureKey, children }) => {
  // Values come from the API as booleans, no need to check for === 'true'
  const featureValue = store.get(featureKey);

  if (featureValue) {
    return children;
  }

  return null;
};
