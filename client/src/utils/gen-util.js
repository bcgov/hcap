export const keyedString = (str, keyValues) =>
  Object.keys(keyValues).reduce(
    (incoming, key) => incoming.replace(`:${key}`, keyValues[key]),
    str
  );

/**
 * Sorts a list of objects based on the values of a given key
 *
 * @param {[{}]} items list of objects to sort
 * @param {string} key object key to sort by
 * @param {string} direction asc or desc, will not sort if the value is anything else
 * @returns sorted list of objects based on given key and direction
 */
export const sortObjects = (items, key, direction = 'asc') => {
  if (!items) {
    return [];
  }
  return items.sort((itema, itemb) => {
    // guard against null values
    const a = itema[key] ?? '';
    const b = itemb[key] ?? '';

    switch (direction) {
      case 'asc':
        return a.toString().localeCompare(b, 'en', { numeric: true });
      case 'desc':
        return b.toString().localeCompare(a, 'en', { numeric: true });
      default:
        return 0;
    }
  });
};
