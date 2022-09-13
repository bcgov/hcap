export const keyedString = (str, keyValues) =>
  Object.keys(keyValues).reduce(
    (incoming, key) => incoming.replace(`:${key}`, keyValues[key]),
    str
  );
export const capitalizedString = (str) => str.charAt(0).toUpperCase() + str.slice(1);

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
    switch (direction) {
      case 'asc':
        return itema[key].toString().localeCompare(itemb[key], 'en', { numeric: true });
      case 'desc':
        return itemb[key].toString().localeCompare(itema[key], 'en', { numeric: true });
      default:
        return 0;
    }
  });
};
