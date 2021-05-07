function decodeToken(str) {
  str = str.split('.')[1];
  str = str.replace('/-/g', '+');
  str = str.replace('/_/g', '/');
  switch (str.length % 4) {
    case 0:
      break;
    case 2:
      str += '==';
      break;
    case 3:
      str += '=';
      break;
    default:
      throw new Error('Invalid token');
  }
  str = (str + '===').slice(0, str.length + (str.length % 4));
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  str = decodeURIComponent(escape(atob(str)));
  return JSON.parse(str);
}
exports.decodeToken = decodeToken;
