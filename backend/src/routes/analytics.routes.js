import { Router } from 'express'
import { z } from 'zod'
import { analyzeQuestion } from '../controllers/analytics.controller.js'
import { validateRequest } from '../middleware/validateRequest.js'

const router = Router()
const requestSchema = z.object({
  question: z.string().trim().min(3).max(1000),
  conversationId: z.string().uuid().optional(),
}).strict()

router.post('/', validateRequest({ body: requestSchema }), analyzeQuestion)

export default router
