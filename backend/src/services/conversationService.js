const MAX_CONVERSATIONS = 200
const TTL_MS = 30 * 60 * 1000
const conversations = new Map()

function pruneExpired(now = Date.now()) {
  for (const [id, state] of conversations) {
    if (now - state.updatedAt > TTL_MS) conversations.delete(id)
  }
  while (conversations.size > MAX_CONVERSATIONS) {
    conversations.delete(conversations.keys().next().value)
  }
}

export function getConversationContext(id) {
  if (!id) return null
  pruneExpired()
  const state = conversations.get(id)
  if (!state) return null
  state.updatedAt = Date.now()
  return { previousQuestion: state.previousQuestion, previousSql: state.previousSql }
}

export function saveConversationTurn(id, { question, sql = null }) {
  if (!id) return
  pruneExpired()
  conversations.delete(id)
  conversations.set(id, {
    previousQuestion: String(question).slice(0, 1000),
    previousSql: typeof sql === 'string' ? sql.slice(0, 12000) : null,
    updatedAt: Date.now(),
  })
  pruneExpired()
}

