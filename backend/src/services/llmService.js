import ollama from 'ollama'

export async function generateSQL(question, schema) {
  const response = await ollama.chat({
    model: 'qwen2.5-coder:7b',
    messages: [
      {
        role: 'system',
        content: `
          You are a PostgreSQL analytics assistant.
          Generate read-only SQL queries only.
          Use only the supplied database schema.
        `,
      },
      {
        role: 'user',
        content: `
          Database schema:
          ${schema}

          User question:
          ${question}
        `,
      },
    ],
  })

  return response.message.content
}
