import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import healthRouter from './routes/health.js'
import schemaRouter from './routes/schema.js'
import { errorHandler } from './middleware/errorHandler.js'
import { config } from './config/env.js'

const app = express()

app.use(helmet())
app.use(cors({ origin: config.clientOrigin }))
app.use(express.json({ limit: '32kb' }))

app.get('/api', (_request, response) => {
  response.json({ name: 'AI Data Analytics Assistant API', status: 'ok' })
})

app.use('/api/health', healthRouter)
app.use('/api/schema', schemaRouter)

app.use((_request, response) => {
  response.status(404).json({ status: 'error', message: 'Route not found' })
})

app.use(errorHandler)

export default app
