export const keyedString = (str, keyValues) =>
  Object.keys(keyValues).reduce(
    (incoming, key) => incoming.replace(`:${key}`, keyValues[key]),
    str
  );
