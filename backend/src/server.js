import 'dotenv/config'
import app from './app.js'
import { pool } from './db/pool.js'
import { config } from './config/env.js'

const server = app.listen(config.port, () => {
  console.log(`API server listening on http://localhost:${config.port}`)
})

async function shutdown(signal) {
  console.log(`${signal} received; closing API server`)
  server.close(async () => {
    await pool.end()
    process.exit(0)
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
