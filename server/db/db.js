const { MongoClient } = require('mongodb');
const logger = require('../logger.js');

/**
 * This utility module provides helper methods to allow the application
 * to easily interact with a DocumentDB/MongoDB database
 */
class DBClient {
  constructor() {
    /**
     * DB Connection
     *
     * @type {MongoClient|null}
     * @memberof DB
     */
    this._connection = null;

    /**
     * Current Database
     *
     * @type {Db|null}
     * @memberof DB
     */
    /** eslint-disable-next-line */
    this.db = null;
  }

  /**
   * Connect to database
   *
   * @returns {Promise<void>}
   * @memberof DB
   */
  async connect() {
    if (this._connection) return;

    const database = process.env.MONGODB_DATABASE || 'development';
    const uri = process.env.MONGODB_URI || `mongodb://development:development@localhost:27017/${database}`;

    try {
      this._connection = await MongoClient.connect(uri);
      this.db = this._connection.db(database);
    } catch (err) {
      logger.error(`Failed to connect to database: ${err}`);
      throw new Error('DBError');
    }
  }

  /**
   * Change database being used
   *
   * @param {*} database
   * @memberof DBClient
   */
  useDB(database) {
    this.db = this._connection.db(database);
  }

  /**
     * Disconnect from database
     *
     * @returns
     * @memberof DB
     */
  async disconnect() {
    if (!this._connection) return;

    try {
      await this._connection.close();
    } catch (err) {
      logger.error(`Failed to disconnect from database: ${err}`);
    }
  }
}

DBClient.instance = new DBClient();

module.exports = {
  dbClient: DBClient.instance,
};
