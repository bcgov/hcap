const massive = require('massive');
const migrationRunner = require('node-pg-migrate');

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

  async runMigration(useTestDb) {
    const {
      host,
      port,
      database,
      user,
      password,
    } = this.settings;

    try {
      const results = await migrationRunner.default({
        databaseUrl: `postgres://${user}:${password}@${host}:${port}/${useTestDb ? 'db_test' : database}`,
        direction: 'up',
        migrationsTable: 'pgmigrations', // default, do not change
        dir: 'migrations', // default, do not change
      });
      await this.db.reload();
      return results;
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
    this.db = await massive({ ...this.settings, database: useTestDb ? 'db_test' : this.settings.database });
  }
}

DBClient.instance = new DBClient();

module.exports = {
  dbClient: DBClient.instance,
};
