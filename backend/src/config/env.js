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
  analyticsDatabaseRole: process.env.ANALYTICS_DB_ROLE || 'analytics_user',
  analyticsQueryTimeoutMs: Number(process.env.ANALYTICS_QUERY_TIMEOUT_MS) || 5000,
  analyticsMaxRows: Number(process.env.ANALYTICS_MAX_ROWS) || 500,
  ollamaHost: process.env.OLLAMA_HOST || 'http://127.0.0.1:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'qwen2.5-coder:7b',
  ollamaTimeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS) || 120000,
  ollamaTemperature: Number(process.env.OLLAMA_TEMPERATURE ?? 0.1),
  ollamaNumCtx: Number(process.env.OLLAMA_NUM_CTX) || 8192,
  analyticsSystemPrompt: process.env.ANALYTICS_SYSTEM_PROMPT,
}

export const hasDatabaseConfiguration = Boolean(
  config.databaseUrl || (config.databaseName && config.databaseUser),
)
