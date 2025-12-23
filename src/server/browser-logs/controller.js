import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { toEcs } from '#src/server/browser-logs/ecs-transformer.js'
import { config } from '#src/config/config.js'

export const browserLogsController = {
  options: {
    plugins: {
      crumb: false // Disable CSRF for sendBeacon() requests
    }
  },
  /**
   * Logging API endpoint, requires Authentication via cookie
   */
  handler(request, h) {
    // Check if browser logging is enabled
    if (!config.get('enableBrowserLogging')) {
      return h.response().code(statusCodes.notFound)
    }

    try {
      const browserEvent = request.payload
      const ecsLog = toEcs(browserEvent)
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
