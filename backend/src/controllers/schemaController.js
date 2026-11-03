import { asyncHandler } from '../middleware/asyncHandler.js'
import { getSchema } from '../services/schemaService.js'

export const getSchemaMetadata = asyncHandler(async (request, response) => {
  const schema = request.validated.query.schema
  const tables = await getSchema(schema)

  response.json({ schema, tables })
})
