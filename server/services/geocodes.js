const { dbClient, collections } = require('../db');

const getPointsFromPostalCodes = async (postalCodes) => {
  const queryPoint = async (postalCode) => {
    const spacedCode = postalCode.includes(' ')
      ? postalCode
      : `${postalCode.substring(0, 3)} ${postalCode.substring(3)}`;
    const request = await dbClient.db[collections.GEOCODES].findOne({
      postal_code: spacedCode,
    });

    if (request) {
      // Happy path, full match on postal code
      return {
        lat: request.latitude,
        lng: request.longitude,
        match: request.postal_code.replace(' ', ''),
      };
    }
    const approxRequest = await dbClient.db[collections.GEOCODES].findOne({
      'postal_code like': `${spacedCode.slice(0, -1)}%`,
    });

    if (approxRequest) {
      // Slightly contented path
      return {
        lat: approxRequest.latitude,
        lng: approxRequest.longitude,
        match: approxRequest.postal_code.replace(' ', ''),
      };
    }

    // Unhappy path
    return { match: null };
  };

  if (Array.isArray(postalCodes)) {
    const points = postalCodes.map((postalCode) => queryPoint(postalCode));
    const values = await Promise.allSettled(points);
    return postalCodes.reduce((acc, postalCode, i) => (
      {
        ...acc,
        [postalCode]: values[i].value,
      }), {});
  }
  const point = await queryPoint(postalCodes);
  return { [postalCodes]: point };
};

module.exports = {
  getPointsFromPostalCodes,
};
