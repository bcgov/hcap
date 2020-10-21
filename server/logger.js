const winston = require('winston');
require('winston-mongodb');

const nodeEnv = process.env.NODE_ENV || 'development';
winston.add(new winston.transports.Console(nodeEnv === 'test' && { silent: true }));

const dbServer = process.env.MONGO_HOST || 'mongodb';
const dbPort = process.env.MONGO_PORT || '27017';
const dbUser = process.env.MONGO_USER || 'admin';
const dbPassword = process.env.MONGO_PASSWORD || 'development';
const dbName = process.env.MONGO_DB || 'logs';

winston.add(new winston.transports.MongoDB({
  db: `mongodb://${dbUser}:${dbPassword}@${dbServer}:${dbPort}/${dbName}`,
}));

module.exports = winston;
