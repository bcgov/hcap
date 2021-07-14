const winston = require('winston');
const { format } = require('winston');
const { object } = require('yup');
require('winston-mongodb');

const { timestamp, combine, label, printf } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
  let newMessage = typeof message === 'string' ? message : JSON.stringify(message, null, 2);
  return `${timestamp} | [${label || 'console'}] ${level}: ${newMessage}`;
});

const dbServer = process.env.MONGO_HOST;
const dbPort = process.env.MONGO_PORT || '27017';
const dbUser = process.env.MONGO_USER;
const dbPassword = process.env.MONGO_PASSWORD;
const dbName = process.env.MONGO_DB || 'logs';
const queryParams =
  typeof process.env.MONGO_REPLICA === 'undefined' ? '' : `replicaSet=${process.env.MONGO_REPLICA}`;

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
    format: combine(label({ label: 'console' }), timestamp(), myFormat),
  })
);

module.exports = winston;
