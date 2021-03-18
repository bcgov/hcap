/* eslint-disable max-len */
const { dbClient, collections } = require('../db');

exports.up = async () => {
  const duplicates = [300616, 300598, 300105, 300219, 300141, 300153, 300217, 300195, 300180, 300173, 300199, 300246, 300296, 300239, 300247, 300260, 300277, 300210, 300299, 300262, 300317, 300406, 300312, 300272, 300334, 300366, 300369, 300413, 300396, 300424, 300449, 300378, 300388, 300425, 300417, 300464, 300564, 300458, 300482, 300451, 300510, 300514, 300555, 300623, 300631, 300644, 300613, 300606, 300645, 300655];
  await dbClient.db[collections.PARTICIPANTS].updateDoc(
    { maximusId: duplicates.map((i) => `${i}`) }, // Cast to string
    { interested: 'withdrawn' },
  );
};
