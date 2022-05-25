export const keyedString = (str, keyValues) =>
  Object.keys(keyValues).reduce(
    (incoming, key) => incoming.replace(`:${key}`, keyValues[key]),
    str
  );
export const capitalizedString = (str) => str.charAt(0).toUpperCase() + str.slice(1);
