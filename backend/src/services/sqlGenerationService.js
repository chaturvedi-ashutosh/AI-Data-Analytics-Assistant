import { requestCompletion } from './llmService.js'
import { getSchemaContext } from './schemaService.js'
import { parseModelResponse } from './responseParser.js'

export async function generateSqlForQuestion(question, {
  completion = requestCompletion,
  schemaLoader = getSchemaContext,
  schemaContext: suppliedSchemaContext = null,
  conversationContext = null,
  validationFeedback = null,
} = {}) {
  const schemaContext = suppliedSchemaContext || await schemaLoader()
  const raw = await completion(question, schemaContext, { conversationContext, validationFeedback })
  return { ...parseModelResponse(raw), schemaContext }
}
