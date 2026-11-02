import cors from 'cors'
import express from 'express'
import healthRouter from './routes/health.js'

const app = express()

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }))
app.use(express.json())

app.get('/api', (_request, response) => {
  response.json({ name: 'AI Data Analytics Assistant API', status: 'ok' })
})

app.use('/api/health', healthRouter)

app.use((_request, response) => {
  response.status(404).json({ error: 'Route not found' })
})

app.use((error, _request, response, _next) => {
  console.error(error)
  response.status(error.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
  })
})

export default app
