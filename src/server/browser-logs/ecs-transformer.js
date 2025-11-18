/**
 * Transform browser error event to ECS (Elastic Common Schema) format
 * Follows CDP-allowed subset of ECS fields
 * @param {Object} event - Browser error event payload
 * @returns {Object} ECS-formatted log entry
 */
export function toEcs(event) {
  return {
    '@timestamp': new Date(event.timestamp).toISOString(),
    message: event.message,
    log: {
      level: event.level || 'error',
      logger: 'browser',
      origin: {
        file: event.source || undefined,
        line: event.line || undefined
      }
    },
    event: {
      action: event.type,
      sequence: event.occurrenceCount || undefined
    },
    error: event.stack
      ? {
          message: event.message,
          stack_trace: event.stack
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
