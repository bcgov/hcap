import store from 'store';

export const FEATURE_MULTI_ORG_PROSPECTING = 'FEATURE_MULTI_ORG_PROSPECTING';
export const featureFlag = (key) => store.get(key) || false;
