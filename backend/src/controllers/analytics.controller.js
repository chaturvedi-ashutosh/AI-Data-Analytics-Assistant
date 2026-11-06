import { asyncHandler } from '../middleware/asyncHandler.js'
import { getConversationContext, saveConversationTurn } from '../services/conversationService.js'
import { analyzeQuestion as analyzeQuestionService } from '../services/analyticsService.js'

export const analyzeQuestion = asyncHandler(async (request, response) => {
  const question = request.validated.body.question.trim()
  const conversationId = request.validated.body.conversationId
  const conversationContext = getConversationContext(conversationId)
  const result = await analyzeQuestionService(question, { conversationContext })
  if (result.status === 'rejected') {
    console.warn('Rejected generated SQL during validation', { message: result.reason })
    return response.status(422).json({
      status: 'rejected',
      message: 'The generated query violates read-only, schema, or resource limits and was not executed.',
    })
  }
  if (result.status === 'clarification_needed') saveConversationTurn(conversationId, { question })
  else saveConversationTurn(conversationId, { question, sql: result.sql })
  response.json(result)
})
