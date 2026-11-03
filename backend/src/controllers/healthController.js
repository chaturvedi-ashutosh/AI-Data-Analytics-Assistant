import { asyncHandler } from '../middleware/asyncHandler.js'
import { checkDatabaseConnection } from '../db/pool.js'

export const getHealth = asyncHandler(async (_request, response) => {
  try {
    await checkDatabaseConnection()
    response.json({
      status: 'ok',
      services: { api: 'ok', database: 'ok' },
      timestamp: new Date().toISOString(),
    })
  } catch {
    response.status(503).json({
      status: 'degraded',
      services: { api: 'ok', database: 'unavailable' },
      message: 'Database is unavailable or DATABASE_URL is not configured.',
      timestamp: new Date().toISOString(),
    })
  }
})
