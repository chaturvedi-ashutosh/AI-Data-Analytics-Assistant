import pg from 'pg'
import { config, hasDatabaseConfiguration } from '../config/env.js'

const { Pool } = pg
const connectionSettings = config.databaseUrl
  ? { connectionString: config.databaseUrl }
  : {
      host: config.databaseHost,
      port: config.databasePort,
      database: config.databaseName,
      user: config.databaseUser,
      password: config.databasePassword,
    }

export const pool = new Pool({
  ...connectionSettings,
  max: config.databasePoolMax,
  connectionTimeoutMillis: config.databaseConnectionTimeoutMs,
  idleTimeoutMillis: config.databaseIdleTimeoutMs,
  statement_timeout: config.databaseStatementTimeoutMs,
  application_name: 'ai-data-analytics-assistant',
})

pool.on('error', (error) => {
  console.error('Unexpected idle PostgreSQL client error:', error.message)
})

export async function checkDatabaseConnection() {
  if (!hasDatabaseConfiguration) {
    throw new Error('Set DATABASE_URL or DB_NAME and DB_USER in backend/.env')
  }

  await pool.query('SELECT 1')
}
