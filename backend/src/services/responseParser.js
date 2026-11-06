function removeFence(value) {
  return String(value || '').trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
}

function parseJsonObject(text) {
  const cleaned = removeFence(text)
  try {
    return JSON.parse(cleaned)
  } catch {
    const start = cleaned.indexOf('{')
    const end = cleaned.lastIndexOf('}')
    if (start < 0 || end <= start) return null
    try { return JSON.parse(cleaned.slice(start, end + 1)) } catch { return null }
  }
}

export function parseModelResponse(rawResponse) {
  const parsed = parseJsonObject(rawResponse)
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw Object.assign(new Error('The model response was not valid structured JSON'), { status: 502 })
  }
  if (typeof parsed.explanation !== 'string' || typeof parsed.clarificationNeeded !== 'boolean') {
    throw Object.assign(new Error('The model response is missing required fields'), { status: 502 })
  }
  if (parsed.clarificationNeeded) return { sql: null, explanation: parsed.explanation.trim(), status: 'clarification_needed' }
  if (typeof parsed.sql !== 'string' || !parsed.sql.trim()) {
    throw Object.assign(new Error('The model response did not contain SQL'), { status: 502 })
  }
  return { sql: parsed.sql.trim(), explanation: parsed.explanation.trim(), status: 'generated' }
}
