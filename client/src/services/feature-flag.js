import store from 'store';

export const flags = {
  FEATURE_PHASE_ALLOCATION: 'FEATURE_PHASE_ALLOCATION',
};

export const isFeatureFlagOn = (key) => store.get(key) === 'true' || false;

export const FeatureFlag = ({ key, children }) => {
  if (isFeatureFlagOn(key)) {
    return children;
  }
  return null;
};
