const { dbClient, collections } = require('..');

module.exports.up = async (next) => {
  await dbClient.connect();
  const formsCollection = dbClient.db.collection(collections.FORMS);

  await formsCollection.updateMany(
    { version: { $exists: false } },
    { $set: { version: 1 } },
  );

  await dbClient.disconnect();
  return next();
};

module.exports.down = async (next) => {
  await dbClient.connect();
  const formsCollection = dbClient.db.collection(collections.FORMS);

  await formsCollection.updateMany(
    { version: { $exists: true } },
    { $unset: { version: '' } },
  );

  await dbClient.disconnect();
  return next();
};
