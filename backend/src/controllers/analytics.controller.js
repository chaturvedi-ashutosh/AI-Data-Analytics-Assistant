import { asyncHandler } from '../middleware/asyncHandler.js'
import { generateSqlForQuestion } from '../services/sqlGenerationService.js'
import { validateSql } from '../services/sqlValidator.js'
import { executeAnalyticsQuery } from '../services/queryService.js'

export const analyzeQuestion = asyncHandler(async (request, response) => {
  const question = request.validated.body.question.trim()
  const generated = await generateSqlForQuestion(question)
  if (generated.status === 'clarification_needed') {
    return response.json({
      question,
      sql: null,
      explanation: generated.explanation,
      status: 'clarification_needed',
    })
  }

  let validatedQuery
  try {
    validatedQuery = validateSql(generated.sql, generated.schemaContext)
  } catch (error) {
    console.warn('Rejected generated SQL during validation', { code: error.code, message: error.message })
    return response.status(422).json({
      status: 'rejected',
      message: 'The generated query violates read-only, schema, or resource limits and was not executed.',
    })
  }

  const execution = await executeAnalyticsQuery(validatedQuery)
  response.json({
    question,
    sql: validatedQuery.sql,
    explanation: generated.explanation,
    columns: execution.columns,
    rows: execution.rows,
    truncated: execution.truncated,
    executionTime: execution.executionTime,
    status: 'success',
  })
})
