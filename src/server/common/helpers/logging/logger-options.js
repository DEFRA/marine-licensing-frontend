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
  ignoreFunc: (_options, request) =>
    request.path.startsWith('/public/') ||
    ['/health', '/favicon.ico'].includes(request.path),
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
