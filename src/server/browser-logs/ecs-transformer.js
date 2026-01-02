/**
 * Transform browser error event to ECS (Elastic Common Schema) format
 * Uses only CDP-allowed subset of ECS fields
 * @param {Object} event - Browser error event payload
 * @returns {Object} ECS-formatted log entry
 */
export function toEcs(event) {
  const ts =
    typeof event.timestamp === 'string'
      ? Number(event.timestamp)
      : event.timestamp
  const timestamp = new Date(ts)
  const timestampStr = Number.isNaN(timestamp.getTime())
    ? new Date().toISOString()
    : timestamp.toISOString()

  return {
    '@timestamp': timestampStr,
    message: event.message,
    log: {
      level: event.level || 'error',
      logger: 'browser'
    },
    event: {
      action: event.type
    },
    error: event.stack
      ? {
          message: event.message,
          stack_trace: event.stack,
          type: event.errorType || 'Error'
        }
      : undefined,
    user_agent: {
      original: event.userAgent
    },
    url: {
      path: event.url
    }
  }
}
