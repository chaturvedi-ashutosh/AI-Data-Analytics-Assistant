import { Router } from 'express'
import { z } from 'zod'
import { getSchemaMetadata } from '../controllers/schemaController.js'
import { validateRequest } from '../middleware/validateRequest.js'

const router = Router()
const schemaQuery = z.object({ schema: z.literal('public').default('public') }).strict()

router.get('/', validateRequest({ query: schemaQuery }), getSchemaMetadata)

export default router
