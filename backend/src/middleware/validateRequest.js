export function validateRequest(schemas) {
  return (request, response, next) => {
    const validated = {}

    for (const [location, schema] of Object.entries(schemas)) {
      const result = schema.safeParse(request[location])

      if (!result.success) {
        return response.status(400).json({
          status: 'error',
          message: `Invalid ${location}`,
          details: result.error.issues.map(({ path, message }) => ({ path, message })),
        })
      }

      validated[location] = result.data
    }

    request.validated = validated
    next()
  }
}
