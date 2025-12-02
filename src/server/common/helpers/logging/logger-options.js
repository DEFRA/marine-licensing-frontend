import { ecsFormat } from '@elastic/ecs-pino-format'
import { config } from '#src/config/config.js'
import { getTraceId } from '@defra/hapi-tracing'

const logConfig = config.get('log')
const serviceName = config.get('serviceName')
const serviceVersion = config.get('serviceVersion')

const options = {}

if (config.get('isDevelopment')) {
  options.ignore = 'pid,res,req'
}
const formatters = {
  ecs: {
    ...ecsFormat({
      serviceVersion,
      serviceName
    })
  },
  'pino-pretty': { transport: { target: 'pino-pretty', options } }
}
export const loggerOptions = {
  enabled: logConfig.enabled,
  ignoreFunc: (_options, request) => {
    if (request.path.startsWith('/public/')) {
      return true
    }

    if (['/health', '/favicon.ico'].includes(request.path)) {
      return true
    }

    // Browser logs will ordinarily generate two log entries: a) the line we deliberately output using
    // request.logger.info(), and b) the standard (uninteresting) log to indicate a what URL was hit that has the
    // payload for the logs.  This drops the uninteresting line and keeps the line with the error message which
    // is the one that doesn't have a payload on the request obj.  This may seem slightly counter-intuitive.
    if (request.path === '/api/browser-logs' && request.payload !== undefined) {
      return true
    }

    return false
  },
  redact: {
    paths: logConfig.redact,
    remove: true
  },
  level: logConfig.level,
  ...formatters[logConfig.format],
  nesting: true,
  mixin() {
    const mixinValues = {}
    const traceId = getTraceId()
    if (traceId) {
      mixinValues.trace = { id: traceId }
    }
    return mixinValues
  }
}
