import store from 'store';


export const isFeatureFlagOn = (key) => store.get(key) === 'true' || false;

export const FeatureFlag = ({ key, children }) => {
  if (isFeatureFlagOn(key)) {
    return children;
  }
  return null;
};
