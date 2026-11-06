import { requestCompletion } from './llmService.js'
import { getSchemaContext } from './schemaService.js'
import { parseModelResponse } from './responseParser.js'

export async function generateSqlForQuestion(question, { completion = requestCompletion, schemaLoader = getSchemaContext } = {}) {
  const schemaContext = await schemaLoader()
  const raw = await completion(question, schemaContext)
  return { ...parseModelResponse(raw), schemaContext }
}
