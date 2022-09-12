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
