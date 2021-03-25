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

const updateParticipantCoords = async (participantID) => {
  const participant = await dbClient.db[collections.PARTICIPANTS].findOne({
    id: participantID,
  });

  const coordObject = await queryPoint(participant.body.postalCode);
  if (coordObject.match !== null) {
    dbClient.runRawQuery(`UPDATE ${collections.PARTICIPANTS} SET coords = ST_SetSRID(ST_MakePoint(${coordObject.lng}, ${coordObject.lat}),4326) where id=${participant.id}`);
  }
};

const updateSiteCoords = async (siteID) => {
  const site = await dbClient.db[collections.EMPLOYER_SITES].findOne({
    id: siteID,
  });

  const coordObject = await queryPoint(site.body.postalCode);
  if (coordObject.match !== null) {
    dbClient.runRawQuery(`UPDATE ${collections.EMPLOYER_SITES} SET coords = ST_SetSRID(ST_MakePoint(${coordObject.lng}, ${coordObject.lat}),4326) where id=${site.id}`);
  }
};

module.exports = {
  getPointsFromPostalCodes,
  updateParticipantCoords,
  updateSiteCoords,
};
