import store from 'store';


export const featureFlag = (key) => store.get(key) || false;
