const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

async function getJson(path, { allowUnhealthy = false } = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: 'application/json' },
  })
  const payload = await response.json()

  if (!response.ok && !allowUnhealthy) {
    throw new Error(payload.message || `Request failed with status ${response.status}`)
  }

  return payload
}

export function getHealth() {
  return getJson('/api/health', { allowUnhealthy: true })
}

export function getSchema() {
  return getJson('/api/schema')
}

export async function analyzeQuestion(question) {
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  })
  const payload = await response.json()
  if (!response.ok) throw new Error(payload.message || `Request failed with status ${response.status}`)
  return payload
}
