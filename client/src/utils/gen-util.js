export const keyedString = (str, keyValues) =>
  Object.keys(keyValues).reduce(
    (incoming, key) => incoming.replace(`:${key}`, keyValues[key]),
    str
  );
export const capitalizedString = (str) => str.charAt(0).toUpperCase() + str.slice(1);

/**
 * for use with _orderBy lodash function
 * _orderBy sorts in a case sensitive way like: [1, Z, a, b, c]
 * so check if field is not numeric, lowercase it. toString for safety.
 * @param {{}} item:
 * @param {string} orderBy: field to order by
 * @returns []
 */
export const orderByCaseInsensitive = (item, orderBy) => {
  return typeof item[orderBy] === 'number' ? item[orderBy] : item[orderBy].toString().toLowerCase();
};

/**
 * Sorts a list of objects based on the values of a given key
 *
 * @param {[{}]} items list of objects to sort
 * @param {string} key object key to sort by
 * @param {string} direction asc or desc, will not sort if the value is anything else
 * @returns sorted list of objects based on given key and direction
 */
export const sortRows = (items, key, direction) => {
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
