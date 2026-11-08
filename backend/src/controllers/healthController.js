import { asyncHandler } from '../middleware/asyncHandler.js'
import { checkDatabaseConnection } from '../db/pool.js'
import { config } from '../config/env.js'

async function checkOllamaConnection() {
  try {
    const endpoint = new URL('/api/tags', config.ollamaHost)
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(2000) })
    return response.ok ? 'ok' : 'unavailable'
  } catch {
    return 'unavailable'
  }
}

export const getHealth = asyncHandler(async (_request, response) => {
  const [databaseResult, ollama] = await Promise.allSettled([
    checkDatabaseConnection(),
    checkOllamaConnection(),
  ])
  const database = databaseResult.status === 'fulfilled' ? 'ok' : 'unavailable'
  const llm = ollama.status === 'fulfilled' ? ollama.value : 'unavailable'
  const healthy = database === 'ok' && llm === 'ok'
  const payload = {
    status: healthy ? 'ok' : 'degraded',
    services: { api: 'ok', database, ollama: llm },
    timestamp: new Date().toISOString(),
  }

  if (database !== 'ok') payload.message = 'Database is unavailable or DATABASE_URL is not configured.'
  else if (llm !== 'ok') payload.message = 'Ollama is unavailable at the configured OLLAMA_HOST.'

  response.status(healthy ? 200 : 503).json(payload)
})
