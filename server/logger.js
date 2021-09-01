const winston = require('winston');
const { format } = require('winston');
require('winston-mongodb');

const { timestamp, combine, printf } = format;

const dbServer = process.env.MONGO_HOST;
const dbPort = process.env.MONGO_PORT || '27017';
const dbUser = process.env.MONGO_USER;
const dbPassword = process.env.MONGO_PASSWORD;
const dbName = process.env.MONGO_DB || 'logs';
const queryParams =
  typeof process.env.MONGO_REPLICA === 'undefined' ? '' : `replicaSet=${process.env.MONGO_REPLICA}`;

const formatWithTimestamp = printf(({ level, message, label: _label, timestamp: _timestamp }) => {
  const newMessage = typeof message === 'string' ? message : JSON.stringify(message);
  return `${_timestamp} | [${_label || 'console'}] ${level}: ${newMessage}`;
});

if (dbServer) {
  winston.add(
    new winston.transports.MongoDB({
      options: { useUnifiedTopology: true },
      db: `mongodb://${dbUser}:${dbPassword}@${dbServer}:${dbPort}/${dbName}?${queryParams}`,
    })
  );
}

winston.add(
  new winston.transports.Console({
    format: combine(timestamp(), formatWithTimestamp),
  })
);

module.exports = winston;
