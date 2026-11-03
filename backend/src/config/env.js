import 'dotenv/config'

const port = Number(process.env.PORT) || 3000

export const config = {
  port,
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL,
  databaseHost: process.env.DB_HOST || '127.0.0.1',
  databasePort: Number(process.env.DB_PORT) || 5432,
  databaseName: process.env.DB_NAME,
  databaseUser: process.env.DB_USER,
  databasePassword: process.env.DB_PASSWORD,
  databasePoolMax: Number(process.env.DATABASE_POOL_MAX) || 10,
  databaseConnectionTimeoutMs: Number(process.env.DATABASE_CONNECTION_TIMEOUT_MS) || 5000,
  databaseIdleTimeoutMs: Number(process.env.DATABASE_IDLE_TIMEOUT_MS) || 30000,
  databaseStatementTimeoutMs: Number(process.env.DATABASE_STATEMENT_TIMEOUT_MS) || 10000,
}

export const hasDatabaseConfiguration = Boolean(
  config.databaseUrl || (config.databaseName && config.databaseUser),
)
