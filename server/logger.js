const winston = require('winston');
require('winston-mongodb');

const nodeEnv = process.env.NODE_ENV || 'development';
winston.add(new winston.transports.Console(nodeEnv === 'test' && { silent: true }));

const dbServer = process.env.MONGO_HOST;
const dbPort = process.env.MONGO_PORT || '27017';
const dbUser = process.env.MONGO_USER;
const dbPassword = process.env.MONGO_PASSWORD;
const dbName = process.env.MONGO_DB || 'logs';
const queryParams = typeof process.env.MONGO_REPLICA === 'undefined' ? '' : `replicaSet=${process.env.MONGO_REPLICA}`;

if (dbServer) {
  winston.add(new winston.transports.MongoDB({
    options: { useUnifiedTopology: true },
    db: `mongodb://${dbUser}:${dbPassword}@${dbServer}:${dbPort}/${dbName}?${queryParams}`,
  }));
}

module.exports = winston;
