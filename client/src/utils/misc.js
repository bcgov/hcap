export const scrollUp = () => window.scrollTo({ top: 0, behavior: 'smooth' });

export const addEllipsisMask = (str = '', length = 0) => {
  const ellipsisSymb = '...';
  // Handle null, undefined, or non-string values
  const safeStr = str || '';
  return length >= safeStr.length ? safeStr : safeStr.substring(0, length) + ellipsisSymb;
};
