export function errorHandler(error, _request, response, _next) {
  console.error(error)

  const status = error.status || 500
  const message = error.publicMessage || (status === 502
    ? 'Generated SQL did not pass schema and read-only validation. Rephrase the question and try again.'
    : status < 500 ? error.message : 'Internal server error')

  response.status(status).json({
    status: 'error',
    message,
  })
}
