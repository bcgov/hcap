const { dbClient, collections } = require('../db');

const queryPoint = async (postalCode) => {
  const spacedCode = postalCode.includes(' ')
    ? postalCode
    : `${postalCode.substring(0, 3)} ${postalCode.substring(3)}`;
  const request = await dbClient.db[collections.GEOCODES].findOne({
    postal_code: spacedCode,
  });

  // Happy path, full match on postal code
  if (request) {
    return {
      lat: request.latitude,
      lng: request.longitude,
      match: request.postal_code.replace(' ', ''),
    };
  }

  // Slightly contented path
  const approxRequest = await dbClient.db[collections.GEOCODES].findOne({
    'postal_code like': `${spacedCode.slice(0, -1)}%`,
  });

  if (approxRequest) {
    return {
      lat: approxRequest.latitude,
      lng: approxRequest.longitude,
      match: approxRequest.postal_code.replace(' ', ''),
    };
  }

  // Unhappy path
  return { match: null };
};

const getPointsFromPostalCodes = async (postalCodes) => {
  if (Array.isArray(postalCodes)) {
    const points = postalCodes.map((postalCode) => queryPoint(postalCode));
    const values = await Promise.allSettled(points);
    return postalCodes.reduce((acc, postalCode, i) => (
      {
        ...acc,
        [postalCode.replace(/\s/g, '')]: values[i].value,
      }), {});
  }
  const point = await queryPoint(postalCodes);
  return { [postalCodes]: point };
};

const getParticipantCoords = async (participantID) => {
  const res = await dbClient.runRawQuery(`SELECT ST_AsText(coords) FROM ${collections.PARTICIPANTS} where id=${Number(participantID)};`);
  return res;
};

const getSiteCoords = async (siteID) => {
  const res = await dbClient.runRawQuery(`SELECT ST_AsText(coords) FROM ${collections.EMPLOYER_SITES} where id=${Number(siteID)}`);
  return res;
};

module.exports = {
  getPointsFromPostalCodes,
  getParticipantCoords,
  getSiteCoords,
};
