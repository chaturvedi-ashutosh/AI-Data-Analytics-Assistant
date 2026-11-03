export function errorHandler(error, _request, response, _next) {
  console.error(error)

  const status = error.status || 500
  const message = status < 500 ? error.message : 'Internal server error'

  response.status(status).json({
    status: 'error',
    message,
  })
}
