import logger from '../../logger';

export const createChangeHistory = (participantBody, changes) => {
  try {
    const newBody = { ...participantBody };
    const changeDetails = Object.keys(changes).reduce((target, key) => {
      target.push({
        field: key,
        from: participantBody[key] || 'none',
        to: changes[key],
      });
      return [...target];
    }, []);
    const newHistory = {
      timestamp: new Date(),
      changes: [...changeDetails],
    };
    newBody.history =
      participantBody.history && participantBody.history.constructor === Array
        ? [newHistory, ...participantBody.history]
        : [newHistory];
    return newBody;
  } catch (e) {
    logger.error(`createChangeHistory: fail to create change history: ${e}`);
    throw e;
  }
};
