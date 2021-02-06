/* eslint-disable quotes */

exports.up = async (pgm) => {
  // TODO wait for the IDs and refactor callbackStatus to boolean
  await pgm.sql(`UPDATE participants 
  SET body = jsonb_set(body, '{callbackStatus}', '"Primed"') 
  WHERE updated_at IS NOT NULL AND updated_at < '2021-01-01'`);

  await pgm.sql(`UPDATE participants 
  SET body = jsonb_set(body, '{callbackStatus}', '"Available"') 
  WHERE updated_at IS NULL OR updated_at >= '2021-01-01'`);
};
