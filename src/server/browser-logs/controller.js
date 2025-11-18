import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { toEcs } from '#src/server/browser-logs/ecs-transformer.js'

export const browserLogsController = {
  options: {
    plugins: {
      crumb: false // Disable CSRF for sendBeacon() requests
    }
  },
  handler(request, h) {
    try {
      const browserEvent = request.payload

      // Transform to ECS format
      const ecsLog = toEcs(browserEvent)

      // Log via request.logger
      const logLevel = browserEvent.level || 'error'
      request.logger[logLevel](ecsLog, ecsLog.message)

      return h.response().code(statusCodes.noContent)
    } catch (error) {
      // Silently handle logging errors to prevent infinite loops
      request.logger.error(
        { error: error.message },
        'Failed to process browser log'
      )
      return h.response().code(statusCodes.noContent)
    }
  }
}
