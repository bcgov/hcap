export const scrollUp = () => window.scrollTo({ top: 0, behavior: 'smooth' });

export const addEllipsisMask = (str = '', length = 0) => {
  const ellipsisSymb = '...';
  return length >= str.length ? str : str.substring(0, length) + ellipsisSymb;
};
