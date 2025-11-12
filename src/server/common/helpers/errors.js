import { statusCodes } from '#src/server/common/constants/status-codes.js'
function getCustomTemplate(statusCode) {
  switch (statusCode) {
    case statusCodes.forbidden:
      return 'error/403-forbidden'
    case statusCodes.notFound:
      return 'error/404-not-found'
    case statusCodes.internalServerError:
      return 'error/500-server-error'
    case statusCodes.serviceUnavailable:
      return 'error/503-service-unavailable'
    default:
      // Use the 500 as the generic template
      return 'error/500-server-error'
  }
}
export function catchAll(request, h) {
  const { response } = request

  if (!('isBoom' in response)) {
    return h.continue
  }

  const statusCode = response.output.statusCode

  if (statusCode >= statusCodes.internalServerError) {
    request.logger.error(
      {
        err: response, // Pino automatically serializes Error objects with stack trace
        statusCode,
        path: request.path,
        method: request.method
      },
      'Error occurred'
    )
  }

  const template = getCustomTemplate(statusCode)

  return h.view(template).code(statusCode)
}
export const errorDescriptionByFieldName = (errors = []) => {
  return errors.reduce((error, obj) => {
    error[obj.field] = obj
    return error
  }, {})
}
export const mapErrorsForDisplay = (errors = [], messages = {}) => {
  const errorFields = new Set()

  return errors
    .filter((error) => {
      const field = error.field || error.path
      if (errorFields.has(field[0])) {
        return false
      }

      errorFields.add(field[0])
      return true
    })
    .map((error) => {
      const field = error.field || error.path
      return {
        href: `#${field}`,
        text: messages[error.message] ?? error.message,
        field
      }
    })
}
