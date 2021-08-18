const winston = require('winston');
const { format } = require('winston');
require('winston-mongodb');

const { timestamp, combine, label, prettyPrint } = format;

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

if (process.env.NODE_ENV === 'local') {
  winston.add(
    new winston.transports.Console({
      format: combine(timestamp(), prettyPrint()),
    })
  );
}

// To be removed once bug is fixed - https://issues.redhat.com/browse/LOG-1575
if (process.env.NODE_ENV !== 'local') {
  winston.add(
    new winston.transports.Console({
      format: combine(timestamp(), prettyPrint()),
    })
  );

  winston.add(
    new winston.transports.Console({
      format: combine(label({ label: 'console' }), timestamp(), format.json()),
    })
  );
}

module.exports = winston;
