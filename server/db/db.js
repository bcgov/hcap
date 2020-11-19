const massive = require('massive');
const migrationRunner = require('node-pg-migrate');
const logger = require('../logger.js');

/**
 * This utility module provides helper methods to allow the application
 * to easily interact with a Postgres database
 */
class DBClient {
  constructor() {
    this.settings = {
      host: process.env.POSTGRES_HOST || 'postgres',
      port: process.env.POSTGRES_PORT || 5432,
      database: process.env.POSTGRES_DB,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
    };
    /**
     * Current Database
     *
     * @type {Db|null}
     * @memberof DB
     */
    this.db = null;
  }

  async runMigration() {
    const {
      host,
      port,
      database,
      user,
      password,
    } = this.settings;

    try {
      const results = await migrationRunner.default({
        databaseUrl: `postgres://${user}:${password}@${host}:${port}/${database}`,
        direction: 'up',
        migrationsTable: 'pgmigrations', // default, do not change
        dir: 'migrations', // default, do not change
      });
      results.forEach((result) => {
        logger.info(`Migration success: ${result.name}`);
      });
    } catch (err) {
      throw Error(`Migration error: ${err}`);
    }
  }

  /**
   * Connect to database
   * You don't need to worry about closing the connection in your code.
   * The underlying pg lib worries about it for you.
   *
   * @returns {Promise<void>}
   * @memberof DB
   */
  async connect(useTestDb) {
    if (this.db) return;

    try {
      this.db = await massive({ ...this.settings, database: useTestDb ? 'db_test' : this.settings.database });
    } catch (err) {
      logger.error(`Failed to connect to database: ${err}`);
      throw new Error('DBError');
    }
  }
}

DBClient.instance = new DBClient();

module.exports = {
  dbClient: DBClient.instance,
};
