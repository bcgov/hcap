const optionValidator = ({ options, keys = [] }) => {
  const requiredKeys = [];
  const usage = [];
  keys.forEach((key) => {
    if (!options[key]) {
      requiredKeys.push(key);
      usage.push(`--${key}=<${key}>`);
    }
  });
  if (requiredKeys.length > 0) {
    const message = `Please provide ${requiredKeys.join(', ')}`;
    const usageMessage = `${usage.join(' ')}`;
    return [false, message, usageMessage];
  }
  return [true, ''];
};

module.exports = {
  optionValidator,
};
