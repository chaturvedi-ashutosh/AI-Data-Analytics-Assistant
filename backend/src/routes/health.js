import { Router } from 'express'

const router = Router()

router.get('/', (_request, response) => {
  response.json({ status: 'ok', timestamp: new Date().toISOString() })
})

export default router
