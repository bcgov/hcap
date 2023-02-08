const massive = require('massive');
const migrationRunner = require('node-pg-migrate');
const { ERROR_DUPLICATED } = require('./common');
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
      database: process.env.NODE_ENV === 'test' ? 'db_test' : process.env.POSTGRES_DB,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
    };
    this.db = null;
  }

  async runMigration() {
    const { host, port, database, user, password } = this.settings;
    logger.info('Running db migrations');
    try {
      const results = await migrationRunner.default({
        log: () => {}, // Silence migrations for test suites
        databaseUrl: `postgres://${user}:${password}@${host}:${port}/${database}`,
        direction: 'up',
        migrationsTable: 'pgmigrations', // default, do not change
        dir: 'migrations', // default, do not change
      });
      await this.reload();
      return results;
    } catch (err) {
      throw Error(`Migration error: ${err}`);
    }
  }

  async connect() {
    if (this.db) return;
    logger.info('Connecting to database');
    this.db = await massive(this.settings);
  }

  async disconnect() {
    if (!this.db) return;
    logger.info('Disconnecting from database');
    await this.db.instance.$pool.end();
    this.db = null;
  }

  async reload() {
    return this.db.reload();
  }

  /**
   *
   * @param {string | massive.Select | massive.Insert | massive.Update | massive.Delete} query  Query to run.
   * @param {massive.QueryParams} queryParams  Array of parameters to use for the query.
   *                                           For example, if `query` contains `$1`, this will be replaced with the first element of `queryParams`.
   * @returns  Query result, or nothing if no query is provided.
   */
  async runRawQuery(query, queryParams) {
    if (!query) return [];
    const res = await this.db.query(query, queryParams);
    return res;
  }

  async createDocumentTableIfNotExists(table) {
    if (!table) return;
    try {
      await this.db.createDocumentTable(table);
    } catch (err) {
      if (err.code !== ERROR_DUPLICATED) throw err;
    }
  }

  async createIndexIfNotExists(table, field) {
    if (!table || !field) return;
    try {
      const query = `CREATE UNIQUE INDEX ${field} ON ${table}( (body->>'${field}') ) ;`;
      await this.db.query(query);
    } catch (err) {
      if (err.code !== ERROR_DUPLICATED) throw err;
    }
  }
}

DBClient.instance = new DBClient();

module.exports = {
  dbClient: DBClient.instance,
};
