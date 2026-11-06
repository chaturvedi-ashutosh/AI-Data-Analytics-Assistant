import { Ollama } from 'ollama'
import { config } from '../config/env.js'
import { buildMessages } from './promptService.js'

const ollama = new Ollama({ host: config.ollamaHost })

export async function requestCompletion(question, schemaContext, { client = ollama, conversationContext = null, validationFeedback = null } = {}) {
  try {
    const response = await client.chat({
      model: config.ollamaModel,
      messages: buildMessages(question, schemaContext, conversationContext, validationFeedback),
      format: 'json',
      options: { temperature: config.ollamaTemperature, num_ctx: config.ollamaNumCtx },
      signal: AbortSignal.timeout(config.ollamaTimeoutMs),
    })
    return response.message?.content || ''
  } catch (error) {
    const timeout = error.name === 'TimeoutError' || error.name === 'AbortError'
    throw Object.assign(new Error(timeout ? 'Ollama request timed out' : 'Could not connect to Ollama; confirm it is running and the configured model is available'), {
      status: 503,
      publicMessage: timeout
        ? 'The local Ollama model timed out. Try again or increase OLLAMA_TIMEOUT_MS.'
        : 'Could not connect to Ollama. Confirm the service is running and OLLAMA_MODEL is available.',
      cause: error,
    })
  }
}
